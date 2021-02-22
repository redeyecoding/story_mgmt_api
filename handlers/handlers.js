/*
    Handlers
*/
'use strict'

// Dependencies
const _data = require('../lib/data');
const util = require('../utils/util');

// @TODO DIRECTORY WILL BE CHANGED TO SOMETHING MORE DYNAMIC

// Handler object
const handlers = {};

// Not Found
handlers.notFound = (( data, callback ) => {
    callback(404, { 'Error': 'Page not found' });
});


// Initilize user data processing object
handlers._userDataProcessing = {};


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


// GET Read user data
// required: token
// @Access Private
handlers._userDataProcessing.get = (( data, callback ) => {
    const token = data.headers.token;

    const phoneNumber = typeof(data.queryStrings.phoneNumber) === 'string' && 
        data.queryStrings.phoneNumber.trim().length === 10 ? 
        data.queryStrings.phoneNumber : 
        false;    

    if ( phoneNumber && token ) {
        _data.read('users', phoneNumber, ((statusCode, payload) => { 

            if (statusCode === 200) {
                // Check if user is authorized.
                const authorized = util.tokenValidator(token, payload); 
                
                if ( authorized ) {        
                     // @TODO Validate authenticated users
                    // check if phone number
                    _data.read( 'users', phoneNumber, ((statusCode, tokenData) => {
                        if (statusCode === 200) {
                            callback(statusCode, payload);
                        } else {
                            callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
                        }
                    }) );
            
                } else {
                    callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
                }

            } else{
                callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
            }
        }));
    } else {
        callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
    }
});



// POST - Update files
// Required: phone number
// @desc User Login
// optional: firstName, lastName, email
// @Access Public
handlers._userDataProcessing.post = (( data, callback ) => {
    // Create user profile
        const tosAgreement = data.payload.tosAgreement ? data.payload.tosAgreement : false;

        const phoneNumber = typeof(data.payload.phoneNumber) === 'string' && 
            data.payload.phoneNumber.trim().length === 10 ? 
            data.payload.phoneNumber : 
            false;
    
        const firstName = typeof(data.payload.firstName) === 'string' && 
            data.payload.firstName.trim().length > 0 ? 
            data.payload.firstName : 
            false;
    
        const lastName = typeof(data.payload.lastName) === 'string' && 
            data.payload.lastName.trim().length > 0 ? 
            data.payload.lastName : 
            false;
    
        const password = typeof(data.payload.password) === 'string' && 
            data.payload.password.trim().length > 6 ? 
            data.payload.password : 
            false;
    
    
        if ( phoneNumber && tosAgreement && firstName && lastName && password ) {
                // Set up hash
            const hashPassword = util.generateHashPassword(password);
    
            let userData = {
                id: util.tokenGenerator(),
                phoneNumber :phoneNumber,
                firstName: firstName,
                lastName: lastName,
                tosAgreement: tosAgreement,
                hashPassword: hashPassword,
                token: util.tokenObjectBuilder(),
            };
    
            userData = JSON.stringify(userData);
            // Open the file
            _data.create('users', phoneNumber, userData, callback);
    
        } else {
            callback(400, 
                util.errorUtility(400, 'Missing required fields', 'fileProcessing' ));
        };
});


// PUT - 
// Required: token
// @Desc User updating exiting information
// @Access Private
handlers._userDataProcessing.put = (( data, callback ) => {
    const token = data.headers.token;

    const phoneNumber = typeof(data.queryStrings.phoneNumber) === 'string' && 
        data.queryStrings.phoneNumber.trim().length === 10 ? 
        data.queryStrings.phoneNumber : 
        false;  

    const firstName = typeof(data.payload.firstName) === 'string' && 
        data.payload.firstName.trim().length > 0 ? 
        data.payload.firstName : 
        false;

    const lastName = typeof(data.payload.lastName) === 'string' && 
        data.payload.lastName.trim().length > 0 ? 
        data.payload.lastName : 
        false;

    // get the data ( Read )
    if (token) {
        _data.read('users', phoneNumber, ((statusCode, payload) => { 
            if (statusCode === 200) {
                // Check if user is authorized.
                const authorized = util.tokenValidator(token, payload); 
    
                if ( authorized ) {        
                    let updatedToken = {
                        ...payload,
                        token: util.tokenObjectBuilder(),
                        firstName: data.payload.firstName,
                        lastName: data.payload.lastName,
                    };
                    updatedToken = JSON.stringify(updatedToken);
                    // Update file
                    _data.update('users',phoneNumber, updatedToken, ((statusCode, tokenData) => {
                        if ( statusCode === 200 ) {
                            callback(statusCode, payload);
                        } else {
                            callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
                        }
                    }));
            
                } else {
                    callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
                }            
            } else{
                callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
            }
        }));
    } else {
        callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
    }   
});



// DELETE file from directory
// Required: phone number and id ( valid token )
// @Desc User deleting content
handlers._userDataProcessing.delete = (( data, callback ) => {
    const token = data.headers.token;

    const phoneNumber = typeof(data.queryStrings.phoneNumber) === 'string' && 
        data.queryStrings.phoneNumber.trim().length === 10 ? 
        data.queryStrings.phoneNumber : 
        false;    

    if ( phoneNumber && token ) {
        _data.read('users', phoneNumber, ((statusCode, payload) => { 

            if (statusCode === 200) {
                // Check if user is authorized.
                const authorized = util.checkValidity(token, payload); 
                
                if ( authorized ) {        
                     // Delete user file
                    _data.delete('users',phoneNumber, callback);
            
                } else {
                    callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
                }
                            
            } else{
                callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
            }
        }));
    } else {
        callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
    }
});





// Token Handler Object
handlers.token = (( data, callback ) => {
    // Check for valid inbound request
    const validRequests = ['get','post','delete', 'put'];
    const method = data.method;

    if ( validRequests.includes(method) ) {
        handlers._token[method]( data, callback );
    } else {
        callback(400, { 'Error': 'Invalid request' });
    }
});

// Define _token object
handlers._token = {};

// POST - Create token for logged in user
// @Acces public
// Required: phoneNumber, password
handlers._token.post = ((data, callback) => {
    const phoneNumber = typeof(data.payload.phoneNumber) === 'string' && 
        data.payload.phoneNumber.trim().length === 10 ? 
        data.payload.phoneNumber : 
        false;

    const password = typeof(data.payload.password) === 'string' && 
        data.payload.password.trim().length > 6 ? 
        data.payload.password : 
        false;
    

    // Check if phone is valid and make sure it is attached to an existing user
    if (password && phoneNumber) {
        // look up user and validate phone number
        _data.read('users', phoneNumber, ((statusCode, userData) => {
            // Update the token for the user    
            let updatedToken = {
                ...userData,
                token: util.tokenObjectBuilder()
            };
            updatedToken = JSON.stringify(updatedToken);
            _data.update( 'users', phoneNumber, updatedToken, ((statusCode, tokenData) => {
                if ( statusCode === 200 ) {
                    callback(statusCode, userData)
                } else {
                    callback(500, 
                        util.errorUtility(500, 'Server Error: Could not write to file', 'fileProcessing'));
                }
            }));
        }));

    } else {
        callback(400,util.errorUtility(400, 'Missing required field(s)', 'Authorization' ));
    }
});



// Initiate checks object
handlers._checks = {};

// POST - Create checks for logged in user
// @Acces private
// Required: phoneNumber, password
handlers._checks.post = ((data, callback) => {

});



// GET - Get token
// @Acces private
// Required: token, checkId
handlers._checks.get = ((data, callback) => {

});





// PUT - Edit check
// @Acces private
// Required: checkId
handlers._checks.put = ((data, callback) => {

});





// DELETE - Delete check from check list
// @Access private
// Required: token
handlers._checks.delete = ((data, callback) => {

});







module.exports = handlers;