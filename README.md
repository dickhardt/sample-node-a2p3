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

**need to have another step to create the config file**

4) Register if need be at [setup.a2p3.net](http://setup.a2p3.net) and create a CLI Agent and save the device parameter

5) Edit config.json and insert the `device` parameter

6) `npm run-script register` to create the vault.json file

7) `npm start` will start the server locally

##DotCloud Deployment

1) Register at [DotCloud](http://dotcloud.com) for a free account and install the dotcloud CLI

2) `dotcloud create sample` answer yes to link

3) `dotcloud push` will deploy to dotcloud and show you the URL it is running at

####config.json and vault.json
See [node-a2p3](https://github.com/dickhardt/node-a2p3) for details

##Windows Azure Deployment

1) Register at [Windows Azure](http://www.windowsazure.com/en-us/) for a free 90 day trial account.

2) Goto the [portal](https://manage.windowsazure.com) and create a new Web Site, selecting Quick Create. 

3) Click on the new website to get to its dashboard and set deployment credentials to be a local git repository. Remember the username and password that you set and copy the resulting git repo URL.

4) `git remote add azure <git repo at azure>` will add a git remote to your local copy of the Sample App

5) Add the generated vault.json and config.json files to the repo so that they will be deployed to Azure.

	git add -f vault.json 
	git add -f config.json

6) `git commit -m "adding in vault.json and config.js"` to commit

6) `git push azure master` will push the code to Azure



##How it Works

TBD

##Related

[A2P3 project home page](http://www.a2p3.net)

[A2P3_specs](https://github.com/dickhardt/A2P3_specs) Specifications and POC documentation

[A2P3](https://github.com/dickhardt/A2P3) POC Server implementation source (node.js)

[A2P3_agent](https://github.com/dickhardt/A2P3_agent) POC mobile agent (PhoneGap)

[A2P3_bank](https://github.com/dickhardt/A2P3_bank) POC mobile bank app (PhoneGap)

[node-a2p3](https://github.com/dickhardt/node-a2p3) node.js npm module for A2P3 applications
