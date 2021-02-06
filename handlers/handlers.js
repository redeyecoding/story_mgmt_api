/*
    Handlers
*/

// Handler object
const handlers = {};

// Users
handlers.users = (( data, callback ) => {
    callback(200, 'You\'ve successfully pulled your data!' );
});



// Not Ffound
handlers.notFound = (( data, callback ) => {
    callback(404, { 'Error': 'Page not found' });
});


module.exports = handlers;