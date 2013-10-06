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
  , fs = require('fs')
  , request = require('request')
  , a2p3 = require('a2p3')
// make sure you have a config.json and vault.json per a2p3 documentation
  , config = require('./config.json')
  , vault = require('./vault.json')


var LISTEN_PORT = 8181  // change if you want listen on a different port
var HOST_URL = null


if (process.env.PORT) {
  LISTEN_PORT = process.env.PORT // most host environments set the PORT environment var to be where we listen
}

// returnURL and callbackURL are constructed from the host that we are loaded from
function makeHostUrl (req) {
  if (HOST_URL) return HOST_URL
  HOST_URL = req.headers.origin // HACK, but reliable across platforms for what we want
  return HOST_URL               // as first call inherently needs to be a login
}

var RESOURCES =
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

// HTML for meta refresh and Agent Install Page
// we could read this in once, but reading it in each
// time makes it easy to edit and reload for development
var META_REFRESH_HTML_FILE = __dirname + '/html/meta_refresh.html'


/*
*  Users can use the Agent running on their mobile phone to log into a web site
*  The server sends a qrURL down to the web page which draws a QR code
*  When the WR reader on the Agent reads the QR code, it appends &json=true
*  and the server then responds with a JSON response
*  If the QR code is scanned with a standard reader, then the server returns
*  the agent_install.html page which then tries to redirect the user to
*  Agent scheme. If it is not successful, the User learns how to get an Agent
*  for their phone
*
*  When an Agent is scanning the QR code, the User is running the App on a different
*  device. We use the sessions object to pass the Agent Request and IX Token that
*  we get from the Agent to the session where the App is running
*
*/

// calculate this once
var QR_SESSION_LENGTH = a2p3.random16bytes().length

// Global for holding QR sessions, need to put in DB if running mulitple instances
// NOTE: DOES NOT SCALE AS CODED
// checkForTokenRequest and storeTokenRequest are coded with callbacks so that
// they can easily be implemented to store data in a DB
var sessions = {}

// checks if we are have received the IX Token and Agent Request from the Agent
function checkForTokenRequest ( qrSession, callback ) {
  if ( !sessions[ qrSession ] || !sessions[ qrSession ].ixToken ) return callback( null, null )
  var data = JSON.parse( JSON.stringify( sessions[ qrSession ] ) )
  delete sessions[ qrSession ]
  callback( data )
}

// stores IX Token and Agent Request we received back channel from the Agent
function storeTokenRequest ( qrSession, agentRequest, ixToken, notificationURL, callback ) {
  sessions[ qrSession ] = sessions[ qrSession ] || {} // we might have a remember property stored
  sessions[ qrSession ].ixToken = ixToken
  sessions[ qrSession ].agentRequest = agentRequest
  sessions[ qrSession ].notificationURL = notificationURL
  callback( null )
}

// personal agent links and store images
var STORES =
  { iOS:
    { url: "https://itunes.apple.com/us/app/personal-agent/id615429770?mt=8&uo=4"
    , image: "/images/Download_on_the_App_Store_Badge_US-UK_135x40.png"
    }
  , windowsPhone:
    { url: "http://www.windowsphone.com/en-ca/store/app/personalagent/cb6a6cab-f905-4387-818e-17e838189146"
    , image: "/images/Windows_Phone_Store_154x40.png"
    }
}

// metaRedirectInfoPage() returns a meta-refresh page with the supplied URL
function metaRedirectInfoPage ( redirectURL, userAgent ) {
  var html = fs.readFileSync( META_REFRESH_HTML_FILE, 'utf8' )
  html = html.replace( '$REDIRECT_URL', redirectURL )
  var mobilePlatform = 'iOS'  // default
  if (userAgent.indexOf("Windows Phone 8") > -1)
    mobilePlatform = 'windowsPhone'
  html = html.replace( '$STORE_URL', STORES[mobilePlatform].url)
  html = html.replace( '$STORE_IMAGE', STORES[mobilePlatform].image)
  return html
}

function fetchProfile( agentRequest, ixToken, callback ) {
  var resource = new a2p3.Resource( config, vault )
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
*   request handlers
*/

// loginQR() - called by web app when it wants a QR code link
// creates an agentRequest and state
function loginQR ( req, res )  {
  var qrSession = a2p3.random16bytes()
  req.session.qrSession = qrSession
  var qrCodeURL = makeHostUrl( req ) + '/QR/' + qrSession
  res.send( { result: { qrURL: qrCodeURL, qrSession: qrSession } } )
}

// loginDirect -- loaded when web app thinks it is running on a mobile device that
// can support the agent
// we send a meta-refresh so that we show a info page in case there is no agent to
// handle the a2p3.net: protcol scheme
function loginDirect ( req, res ) {
  var params =
    { returnURL: makeHostUrl( req ) + '/response/redirect'
    , resources: RESOURCES
    }
    , agentRequest = a2p3.createAgentRequest( config, vault, params )
    , redirectURL = 'a2p3.net://token?request=' + agentRequest
    , html = metaRedirectInfoPage( redirectURL, req.headers['user-agent'])
  res.send( html )
}


// clear session, logout user
function logout ( req, res )  {
  req.session = null
  res.redirect('/')
}


// QR Code was scanned
// if scanned by Agent, then 'json=true' has been set and we return the Agent Request in JSON
// if scanned by a general QR reader, then return a meta refresh page with Agent Reqeuest and
// and state parameter of qrSession so we can link the response from the Agent
// back to this web app session in checkQR
function qrCode ( req, res ) {
  var qrSession = req.params.qrSession
  // make sure we got something that looks like a qrSession
  if ( !qrSession || qrSession.length != QR_SESSION_LENGTH || qrSession.match(/[^\w-]/g) ) {
    return res.redirect('/error')
  }
  var params =
    { callbackURL: makeHostUrl( req ) + '/response/callback'
    , resources: RESOURCES
    }
  var agentRequest = a2p3.createAgentRequest( config, vault, params )
  var json = req.query.json
  if ( json ) {
    var response = { result: { agentRequest: agentRequest, state: qrSession } }
    return res.send( response )
  } else {
    var redirectURL = 'a2p3://token?request=' + agentRequest + '&state=' + qrSession
    var html =  metaRedirectInfoPage( redirectURL )
    return res.send( html )
  }

}

/*
* We are getting called back through the redirect which means we are running on the
* same device as the Agent is
*/
function loginResponseRedirect ( req, res )  {
  var ixToken = req.query.token
  var agentRequest = req.query.request

  if (!ixToken || !agentRequest) {
    return res.redirect( '/error' )
  }
  fetchProfile( agentRequest, ixToken, function ( error, results ) {
    if ( error ) return res.redirect( '/error' )
    req.session.profile = results
    return res.redirect('/')
  })
}


/*
* Agent is calling us back with the IX Token and Agent Request, but
* Agent is running on a different device
*/
function loginResponseCallback ( req, res )  {
  var ixToken = req.body.token
  var agentRequest = req.body.request
  var qrSession = req.body.state
  var notificationURL = req.body.notificationURL
  if (!ixToken || !agentRequest || !qrSession) {
    var code = 'MISSING_STATE'
    if (!agentRequest) code = 'MISSING_REQUEST'
    if (!ixToken) code = 'MISSING_TOKEN'
    return res.send( { error: { code: code, message: 'token, request and state are required' } } )
  }
  storeTokenRequest( qrSession, agentRequest, ixToken, notificationURL, function ( error ) {
    if ( error ) return res.send( { error: error } )
    return res.send( { result: { success: true } } )
  })
}



function checkQR ( req, res ) {
  if (!req.body.qrSession)
    return res.send( { error: 'No QR Session provided' } )
  checkForTokenRequest( req.body.qrSession, function ( tokenResponse ) {

    if (!tokenResponse) {
      return res.send( { status: 'waiting'} )
    }
    fetchProfile( tokenResponse.agentRequest, tokenResponse.ixToken, function ( error, results ) {
      var response = {}
      if ( error ) response.error = error
      if ( results ) {
        response.result = results
        req.session.profile = results
      }
      var name = results['people.a2p3.net'] &&
        results['people.a2p3.net'].redirects &&
        results['people.a2p3.net'].redirects[0] &&
        results[ results['people.a2p3.net'].redirects[0] ] &&
        results[ results['people.a2p3.net'].redirects[0] ].name
      if ( tokenResponse.notificationURL && name ) {
        var cookieValue = { name: name, url: tokenResponse.notificationURL }
        res.cookie( 'notificationURL', cookieValue, { maxAge: 900000, signed: true } )
      }
      return res.send( response )
    })
  })
}


function profile ( req, res )  {
  if ( req.session.profile ) {
    return res.send( { result: req.session.profile } )
  } else { //
    return res.send( { errror: 'NOT_LOGGED_IN'} )
  }
}


// check we have valid keys
// TBD -- check that our keys are valid with the Registrar

// set up middleware

app.use( express.static( __dirname + '/html/assets' ) )   // put static assets here
app.use( express.logger( 'dev' ) )                        // so that we only log page requests
app.use( express.limit('10kb') )                          // protect against large POST attack
app.use( express.bodyParser() )

app.use( express.cookieParser('a secret string') )
var cookieOptions =
  { 'secret': 'helloworldsecret'
  , 'cookie': { path: '/' } }
app.use( express.cookieSession( cookieOptions ))

//setup request routes

// these end points are all AJAX calls from the web app and return a JSON response
app.post('/login/QR', loginQR )
app.post('/profile', profile )
app.post('/check/QR', checkQR )

// this page is called by either the Agent or a QR Code reader
// returns either the Agent Request in JSON if called by Agent
// or sends a redirect to the a2p3.net://token URL
// also called by the Agent via the notification URL mechanism
app.get('/QR/:qrSession', qrCode )


// these pages return a redirect
app.get('/logout', logout)
app.get('/login/direct', loginDirect)
// called if App and Agent are on same device
app.get('/response/redirect', loginResponseRedirect )
// called if App and Agent are on different devices
app.post('/response/callback', loginResponseCallback )

// these endpoints serve static HTML pages
app.get('/', function( req, res ) { res.sendfile( __dirname + '/html/index.html' ) } )
app.get('/error', function( req, res ) { res.sendfile( __dirname + '/html/login_error.html' ) } )


app.listen( LISTEN_PORT )

console.log('\nSample App available on this machine on port:', LISTEN_PORT )

// console.log('\nprocess.env dump\n',process.env)
