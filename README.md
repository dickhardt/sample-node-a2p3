sample-node-a2p3
================

Sample application for A2P3
##Prerequsites
- git

- node 0.8.x or later

- Facebook account

####Optional
- [DotCloud](http://dotcloud.com) account

##Install and Setup
1) `git clone git://github.com/dickhardt/sample-node-a2p3.git`

2) `cd sample-node-a2p3`

3) `npm install`

4) Register if need be at [setup.a2p3.net](http://setup.a2p3.net) and create a CLI Agent and save the device parameter

5) Edit config.json and insert the device parameter

6) `npm run-script register` to create the vault.json file

7) `npm start` will start the server locally

##DotCloud Deployment

1) Register at [DotCloud](http://dotcloud.com) for a free account and install the dotcloud CLI

2) `dotcloud create sample` answer yes to 

3) `dotcloud push` will deploy to dotcloud and show you the URL it is running at

####config.json and vault.json
See [node-a2p3](https://github.com/dickhardt/node-a2p3) for details

##How it Works

TBD

##Related

[A2P3.CA](http://a2p3.ca) A2P3 project home page

[A2P3_specs](https://github.com/dickhardt/A2P3_specs) Specifications and POC documentation

[A2P3](https://github.com/dickhardt/A2P3) POC Server implementation source (node.js)

[A2P3_agent](https://github.com/dickhardt/A2P3_agent) POC mobile agent (PhoneGap)

[A2P3_bank](https://github.com/dickhardt/A2P3_bank) POC mobile bank app (PhoneGap)

[node-a2p3](https://github.com/dickhardt/node-a2p3) node.js npm module for A2P3 applications
