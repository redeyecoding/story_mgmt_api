/*
    Base api
*/

const http = require('http');
const https = require('https');
const url = require('url');
const handlers = require('./handlers/handlers');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
const querystring = require('querystring');
const config = require('./config');



// HTTP SERVER
const httpServer = http.createServer(( req, res )=> uVserverUtility(req, res));

// HTTPS SERVER
const options = config.httpsConfig.options;
const httpsServer = https.createServer(options, ( req,res ) => uVserverUtility(req, res));

// Universal Server Utility
const uVserverUtility = (( req, res ) => {
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
                'payload': buffer,
                'method': method,
                'queryStrings': querystring,
                'path': trimmedPath
            };
    
            // FIND HANDLER
            const foundHandler = router[trimmedPath] ? router[trimmedPath] : handlers.notFound;
        
            foundHandler('test-data', (statusCode, data) => {
                console.log('STATUSCODE', statusCode);
                console.log('data', data)
     
            });
        });
    
    
            // console.log(parseUrl);
            // console.log(trimmedPath);
            // console.log(Object.keys(req));
            // console.log(headers);
            // console.log(req);
            // console.log(queryStrings);
        res.end('SUCCESS');
    
});


httpServer.listen(config.httpConfig.httpPort, () => console.log(`HTTP_Server is now listening on port ${config.httpConfig.httpPort} in ${config.httpConfig.envMode} mode.`));
httpsServer.listen(config.httpsConfig.httpsPort, () => console.log(`HTTPS_Server is now listening on port ${config.httpsConfig.httpsPort} in ${config.httpsConfig.envMode} mode.`));


// Router
const router = {
    'users': handlers.users
};


