/*
    Base api
*/
'use strict'

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const handlers = require('./handlers/handlers');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
const querystring = require('querystring');
const config = require('./config');
const util = require('./utils/util');




// HTTP SERVER
const httpServer = http.createServer(( req, res )=> universalServerUtility(req, res));

// HTTPS SERVER
const options = config.httpsConfig.options;
const httpsServer = https.createServer(options, ( req,res ) => universalServerUtility(req, res));

// Universal Server Utility
const universalServerUtility = (( req, res ) => {
        // Parse incoming requests from user
        // get the URL  ( www.website.com/kitchen_goods?tools=pots )
        const parseUrl = url.parse(req.url, true);

        // Extract the path from the URL
        const urlPath = parseUrl.pathname;
        
        // Format the path
        const trimmedPath = urlPath.replace(/^\/+|\/$/g,'');
    
        // pull the method from the request
        const method = req.method.toLowerCase();
    
        // Pull the queryStrings from the URL
        const queryStrings = parseUrl.query;
    
        // Pull the headers?
        const headers = req.headers;
    
    
        // Decode the Inbound Stream
        let buffer = '';
        req.on('data', chunk => buffer += decoder.write(chunk));
       
        req.on('end', () => {
            // Assemble Data Object
            const data = {
                'headers': headers,
                'payload': util.jsonParser(buffer),
                'method': method,
                'queryStrings': queryStrings,
                'path': trimmedPath                
            };

            // FIND HANDLER
            const foundHandler = router[trimmedPath] ? router[trimmedPath] : handlers.notFound;
            
            foundHandler(data, (statusCode, payload) => {
                // Hide hashPassword, id and token
                delete payload.hashPassword;
                delete payload.token;
                delete payload.id;

                payload = JSON.stringify(payload);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(payload);
            }); 
        });   
    
            // console.log(parseUrl);
            // console.log(trimmedPath);
            // console.log(Object.keys(req));
            // console.log(headers);
            // console.log(req);
            // console.log(queryStrings);
            //  console.log('CURRENT path', __dirname)
//            console.log(utils.jsonParser('{"fsf":"fsfsf"}'))

});


httpServer.listen(
    config.httpConfig.httpPort, 
    () => console.log(`HTTP_Server is now listening on port ${config.httpConfig.httpPort} in ${config.httpConfig.envMode} mode.`));

httpsServer.listen(
    config.httpsConfig.httpsPort, 
    () => console.log(`HTTPS_Server is now listening on port ${config.httpsConfig.httpsPort} in ${config.httpsConfig.envMode} mode.`));


// Router
const router = {
    'users': handlers.users,
    'token': handlers.token
};


