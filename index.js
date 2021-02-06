/*
    Base api
*/

const http = require('http');
const url = require('url');
const handlers = require('./handlers/handlers');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');


// HTTP SERVER

const httpServer = http.createServer(( req, res )=>{
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
    const queryStrings = urlPath.query;

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
            'queryStringObject': queryStringObject,
            'path': trimmedPath
        };

        console.log(data)

        // FIND HANDLER
        const foundHandler = router[trimmedPath] ? router[trimmedPath] : handlers.notFound;
    
        // foundHandler('test-data', (statusCode, data) => {
        //     console.log('STATUSCODE', statusCode)
        // }));


    });


        // console.log(parseUrl);
        // console.log(trimmedPath);
        // console.log(Object.keys(req));
        // console.log(headers);
    res.end('SUCCESS');

    });

httpServer.listen(3000, () => console.log(`HttpServer is no listening on port # 3000...`));




// HTTPS SERVER


// Router
const router = {
    'users': handlers.users
};


