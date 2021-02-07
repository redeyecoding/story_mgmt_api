/*
    Handlers
*/

// Dependencies
const _data = require('../lib/data');


// Handler object
const handlers = {};


// Initilize user data processing object
handlers._userDataProcessing = {};


// User data processes
handlers._userDataProcessing.post = (( data, callback ) => {
    // Create user profile

    _data.create('users', data.payload, callback)
    console.log('[HANDLER.js],POST METHOD SUCCESS!!');
});


handlers._userDataProcessing.get = (( data, callback ) => {

    console.log('[HANDLER.js] GET METHOD SUCCESS!!');
});


handlers._userDataProcessing.put = (( data, callback ) => {

    console.log('[HANDLER.js] PUT METHOD SUCCESS!!');
});


handlers._userDataProcessing.delete = (( data, callback ) => {

    console.log('[HANDLER.js] DELETE METHOD SUCCESS!!');
});



// Users
handlers.users = (( data, callback ) => {
    // Check for valid inbound request
    const validRequests = ['get','post','delete', 'put'];
    const method = data.method;

    if ( validRequests.includes(method) ) {
        handlers._userDataProcessing[method]( data, callback );
    } else {
        callback(400, { 'Error': 'Invalid request' });
    }
});


// Not Found
handlers.notFound = (( data, callback ) => {
    callback(404, { 'Error': 'Page not found' });
});


module.exports = handlers;