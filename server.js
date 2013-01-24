/*
* server.js
*
* Sample App
*
* gets all profile data about a user and displays it
*
* Copyright (C) Province of British Columbia, 2013
*/


var express = require('express')
  , app = express()
  , a2p3 = require('a2p3') // change to 'a2p3' if using this as template

var HOST_ID = 'example.a2p3.com'
  , LISTEN_PORT = 8080
  , HOST_URL = 'http://localhost:8080'   // http://localhost:8080 if running locally
  , RESOURCES =
    [ 'http://email.a2p3.net/scope/default'
    , 'http://people.a2p3.net/scope/details'
    , 'http://si.a2p3.net/scope/number'
    , 'http://health.a2p3.net/scope/prov_number'
    ]

var APIS =
  { 'http://email.a2p3.net/email/default': null
  , 'http://people.a2p3.net/details': null
  , 'http://si.a2p3.net/number': null
  , 'http://health.a2p3.net/prov_number': null
  }

/*
*   TBD -- explain the QR Session code below
*
*/

var QR_SESSION_LENGTH = a2p3.random16bytes().length
// Global for holding QR sessions, need to put in DB if running mulitple instances
// NOTE: DOES NOT SCALE AS CODED
// checkForTokenRequest and storeTokenRequest are coded with callbacks so that
// they can easily be implemented to store data in a DB
var sessions = {}

// checks if we are have received the IX Token and Agent Request from the Agent
function checkForTokenRequest( qrSession, callback ) {
  if ( !sessions[qrSession] ) return callback( null, null )
  var agentRequest = sessions[qrSession].agentRequest
  var ixToken = sessions[qrSession].ixToken
  delete sessions[qrSession]
  callback( ixToken, agentRequest )
}

// stores IX Token and Agent Request we received back channel from the Agent
function storeTokenRequest( qrSession, agentRequest, ixToken, callback ) {
  sessions[qrSession] =
    { ixToken: ixToken
    , agentRequest: agentRequest
    }
  callback( null )
}

// login() - called by web app
// creates an agentRequest and state
function login( req, res )  {

debugger;

  var agentRequest = a2p3.createAgentRequest( HOST_URL + '/response', RESOURCES )
  var qrSession = a2p3.random16bytes()
  req.session.qrSession = qrSession
  var qrCodeURL = HOST_URL + '/QR/' + qrSession
  res.send( { result: { agentRequest: agentRequest, qrURL: qrCodeURL, qrSession: qrSession } } )
}

function qrCode( req, res ) {
  var qrSession = req.params.qrSession
  // make sure we got something that looks like a qrSession
  if ( qrSession.length != QR_SESSION_LENGTH || qrSession.match(/[^\w-]/g) ) {
    return res.redirect('/error')
  }
  var agentRequest = a2p3.createAgentRequest( HOST_URL + '/response', RESOURCES )
  var json = req.body.json
  if ( json ) {
    res.send( { result: { agentRequest: agentRequest, state: qrSession } } )
  } else {
    var redirectURL = 'a2p3://token?request=' + agentRequest + '&state=' + qrSession

// TBD make this a page with a meta tag redirect so that User sees error in case
// redirect does not work

    res.redirect( redirectURL )
  }
}

// clear session, logout user
function logout( req, res )  {
  req.session = null
  res.redirect('/')
}

function fetchProfile( agentRequest, ixToken, callback ) {
  var resource = new a2p3.Resource()
  resource.exchange( agentRequest, ixToken, function ( error, di ) {
    if ( error ) return callback ( error )
    var userDI = di // App's directed identifier for User
    resource.callMultiple( APIS, function ( error, results ) {
      if (results)
        results['ix.a2p3.net'] = { di: userDI }
      callback( error, results )
    })
  })
}


/*
if we are getting a state parameter, we are getting the data
directly from the Agent and not via a redirect to our app

*/

function loginResponse( req, res )  {

debugger;

  var ixToken = req.query.token
  var agentRequest = req.query.request
  var qrSession = req.query.state

  if (!ixToken || !agentRequest) {
    return res.redirect( '/error' )
  }
  if ( qrSession ) {
    storeTokenRequest( qrSession, agentRequest, ixToken, function ( error ) {
      if ( error ) return res.redirect( '/error' )
      return res.redirect( '/complete' )
    })
  } else {
    fetchProfile( agentRequest, ixToken, function ( error, results ) {

console.log('fetchProfile')
console.log('error:',error)
console.log('results:',results)

      if ( error ) return res.redirect( '/error' )
      req.session.profile = results
      return res.redirect('/')
    })
  }
}




function checkQR( req, res ) {
  if (!req.body.qrSession)
    return res.send( { error: 'No QR Session provided' } )
    checkForTokenRequest( req.body.qrSession, function ( ixToken, agentRequest ) {
      if (!ixToken || !agentRequest) {
        return res.send( { status: 'waiting'} )
      }
      fetchProfile( agentRequest, ixToken, function ( error, results ) {
        var response = {}
        if ( error ) response.error = error
        if ( results ) {
          response.result = results
          req.session.profile = results
        }
        return res.send( response )
      })
    })

}


function profile( req, res )  {
  if ( req.session.profile ) {
    return res.send( { result: req.session.profile } )
  } else { //
    return res.send( { errror: 'NOT_LOGGED_IN'} )
  }
}

// set up middleware

app.use( express.static( __dirname + '/html/assets' ) )   // put static assets here
app.use( express.logger( 'dev' ) )                        // so that we only log page requests
app.use( express.limit('10kb') )                          // protect against large POST attack
app.use( express.bodyParser() )

app.use( express.cookieParser() )                   // This does not scale to more than one machine
var cookieOptions =                                 // Put in DB backend for session to scale
  { 'secret': a2p3.random16bytes()
  , 'cookie': { path: '/' } }
app.use( express.cookieSession( cookieOptions ))

//setup request routes

// these end points are all AJAX calls from the web app and return a JSON response
app.get('/login', login )
app.get('/profile', profile )
app.post('/check/QR', checkQR )

// this page is called by either the Agent or a QR Code reader
// returns either the Agent Request in JSON if called by Agent
// or sends a redirect to the a2p3.net://token URL
app.get('/QR/:state', qrCode )

// these pages change state and return a redirect
app.get('/response', loginResponse )
app.get('/logout', logout )

// these endpoints serve static HTML pages
app.get('/', function( req, res ) { res.sendfile( __dirname + '/html/index.html' ) } )
app.get('/error', function( req, res ) { res.sendfile( __dirname + '/html/login_error.html' ) } )
app.get('/complete', function( req, res ) { res.sendfile( __dirname + '/html/login_complete.html' ) } )

app.listen( LISTEN_PORT )

console.log('\nSample App started and listening on ', HOST_URL)
