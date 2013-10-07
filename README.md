sample-node-a2p3
================

Sample application for A2P3
##Prerequsites
- git

- node 0.8.x or later

- Facebook account

####Optional
- [AWS](http://aws.amazon.com) account

##Install and Setup
1) `git clone git://github.com/dickhardt/sample-node-a2p3.git`

2) `cd sample-node-a2p3`

3) `npm install`

4) `npm run config`

5) Register if need be at [setup.a2p3.net](http://setup.a2p3.net) and create a CLI Agent and save the device parameter

6) Edit config.json and insert the `device` parameter

7) `npm run register` to create the vault.json file (if you change the App ID, you need to rerun this command)

8) `npm start` will start the server locally

## Accessing Local Server

When accessing your local server, you need to use a hostname that is resolvable on your local network. When accessing from your mobile device (the only way currently to login and test your app), your mobile device needs to be on your local network and be able to resolve the hosthame.

This might not be obvious when logging into the app from a PC and scanning the QR code with your personal agent on your mobile device. If the browser on the PC is not using a hostname resolvable to the server from the mobile device, the personal agent will not be able to complete the login process.

## Deployment to AWS Elastic Beanstalk

1) Add the generated vault.json and config.json files to the local repo so that they will be deployed to AWS:

  git add -f vault.json
  git add -f config.json
  git commit -a -m"add in vault and config"

2) Browse to [AWS](http://aws.amazon.com) and register or login.

3) Get your Access Key ID and Secret Access Key from [Security Credentials](https://portal.aws.amazon.com/gp/aws/securityCredentials)

4) Install and setup the [eb](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/usingCLI.html) CLI tools.

5) `eb init` providing your Access Key ID and Secret Access Key and accept all defaults and selecting a Node.js image.

6) `eb start` will deply and start your application

When you make changes, `git aws.push` will upload your local commits to AWS (remember to `git commit -a -m"<commit description here>"`)

Additional documentation on running [Node on Elastic Beanstalk](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html)

##Related

[A2P3 project home page](http://www.a2p3.net)

[A2P3_specs](https://github.com/dickhardt/A2P3_specs) Specifications and POC documentation

[A2P3](https://github.com/dickhardt/A2P3) POC Server implementation source (node.js)

[A2P3_agent](https://github.com/dickhardt/A2P3_agent) POC mobile agent (PhoneGap)

[A2P3_bank](https://github.com/dickhardt/A2P3_bank) POC mobile bank app (PhoneGap)

[node-a2p3](https://github.com/dickhardt/node-a2p3) node.js npm module for A2P3 applications

[rs-sample-node-a2p3](https://github.com/dickhardt/rs-sample-node-a2p3) sample A2P3 resource server using node-a2p3

## License
MIT License

Copyright (c) 2013 Province of British Columbia

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

