/*
    Handlers
*/
'use strict'

const { stat } = require('fs');
// Dependencies
const _data = require('../lib/data');
const util = require('../utils/util');

// @TODO DIRECTORY WILL BE CHANGED TO SOMETHING MORE DYNAMIC
// @TODO BREAK CODE UP INTO SMALLER MODULES

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


// GET /api/users?phoneNumber=<number>
// required: token
// @Access Private
handlers._userDataProcessing.get = (( data, callback ) => {
    const token = data.headers.token;

    const phoneNumber = typeof(data.queryStrings.phoneNumber) === 'string' && 
        data.queryStrings.phoneNumber.trim().length === 10 ? 
        data.queryStrings.phoneNumber : 
        false;    

    // @TODO Setting token validation and reset of token expiration
    if ( phoneNumber && token ) {
        _data.read(`tokens/${phoneNumber}`, token, ((statusCode, tokenPayload) => { 
            if (statusCode === 200) {
                // Check if user is authorized.
                const authorized = util.tokenValidator(token, tokenPayload, phoneNumber); 
                
                if ( authorized ) {        
                    // check if phone number
                    _data.read( 'users', phoneNumber, ((statusCode, userData) => {
                        if (statusCode === 200) {
                             // Initantiate user's token Object 
                             let updateTokenPayload = {
                                ...tokenPayload,
                                validFrom: util.resetValidToken()
                            };
                            updateTokenPayload = JSON.stringify(updateTokenPayload);

                            // Update the user's token expiration time
                            _data.update(`tokens/${phoneNumber}`, token, updateTokenPayload, ((statusCode, tokenPayload) => {
                                if (statusCode === 200) {
                                    callback(200, userData);
                                } else {
                                    callback(500, util.errorUtility(500, 'Could not restt token expiration timer', 'Authentication'));
                                }
                            }));
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



// POST - /api/users/
// Required: phone number
// @desc User Registration
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
                phoneNumber :phoneNumber,
                firstName: firstName,
                lastName: lastName,
                tosAgreement: tosAgreement,
                hashPassword: hashPassword                
            };    
            userData = JSON.stringify(userData);
            
            // Create new user
            _data.create('users', phoneNumber, userData, ((statusCode, data) => {
                if (statusCode === 200) {
                    // Setup token directory for new user
                    _data.createDir(`tokens/${phoneNumber}`, ((statusCode) => {
                        if (statusCode === 200) {
                            // Generate token for new user
                            let tokenData = util.tokenObjectBuilder();
                            const id = tokenData.token;
                            tokenData.phoneNumber = phoneNumber;
                            tokenData = JSON.stringify(tokenData);

                            // Add tokenData to new users directory
                            //@TODO FIX THIS COnDITION
                            _data.create(`tokens/${phoneNumber}`, id, tokenData, ((statusCode, payload) => {
                                if (statusCode === 200) {
                                    callback(200, util.errorUtility(200, 'Ok'));
                                } else {
                                    callback(500, util.errorUtility(data.code, data.message));
                                }
                            }));
                        } else {
                            callback(500, util.errorUtility(data.code, data.message));
                        }
                    }));
                } else {
                    callback(400, util.errorUtility(data.code, data.message));
                }
            }));
        } else {
            callback(400, 
                util.errorUtility(400, 'Missing required fields', 'fileProcessing' ));
        };
});


// PUT - /api/users/
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

    // Validate token
    if (token) {
        _data.read(`tokens/${phoneNumber}`, token, ((statusCode, tokenPayload) => { 
            
            if (statusCode === 200) {
                // Check if user is authorized.
                const authorized = util.tokenValidator(token, tokenPayload, phoneNumber); 

                if ( authorized ) {
                    // Pull current user data
                    _data.read('users', phoneNumber, ((statusCode, currentUserData) => {
                        if (statusCode === 200) {               
                            // Initiate updated userData object                    
                            let updatedUserData = {
                                ...currentUserData,
                                firstName: firstName,
                                lastName: lastName
                            }; 
                            updatedUserData = JSON.stringify(updatedUserData);

                        // Update user's data
                        _data.update('users', phoneNumber, updatedUserData, ((statusCode, updatedPayload) =>{
                            // Update the user's data
                            if (statusCode === 200) {
                                // Initantiate user's token Object 
                                let updateTokenPayload = {
                                    ...tokenPayload,
                                    validFrom: util.resetValidToken()
                                };
                                updateTokenPayload = JSON.stringify(updateTokenPayload);

                                // Update the user's token expiration time
                                _data.update(`tokens/${phoneNumber}`, token, updateTokenPayload, ((statusCode, tokenPayload) => {
                                    if (statusCode === 200) {
                                        callback(200, tokenPayload);
                                    } else {
                                        callback(500, util.errorUtility(500, 'Could not restt token expiration timer', 'Authentication'));
                                    }
                                }));
                            } else {
                                callback(400, util.errorUtility(tokenPayload.code, tokenPayload.message, 'File processing'));
                            }
                        }));

                        } else {
                            callback(500, util.errorUtility(500, 'Could not update user data.', 'File processing'));
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
        callback(400, util.errorUtility(400, 'Missing or invalid token', 'Authentication'));
    }   
});



// DELETE /api/users/
// Required: phone number and id ( valid token )
// @Desc User deleting content
handlers._userDataProcessing.delete = (( data, callback ) => {
    const token = data.headers.token;

    const phoneNumber = typeof(data.queryStrings.phoneNumber) === 'string' && 
        data.queryStrings.phoneNumber.trim().length === 10 ? 
        data.queryStrings.phoneNumber : 
        false;    
    
    
        // @TODO fix this contidition to check for phone number from valid token
    if ( phoneNumber && token ) {
        _data.read('users', phoneNumber, ((statusCode, payload) => { 

            if (statusCode === 200) {
                // Check if user is authorized.
                const authorized = util.tokenValidator(token, payload); 
                
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

// POST - /token/
// @Desc User Login
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
            // Validate the password
            const passwordIsValid = util.generateHashPassword(password) === userData.hashPassword ? true : false;
            
            if (statusCode === 200 && passwordIsValid) {

                // Delete the existing token(if any) and create a new one for the user.
                _data.deleteFiles(`tokens/${phoneNumber}`, ((statusCode, tokenPayload) => {
                    if (statusCode === 200) {
                        // Create a new token object for the user                
                        let tokenObject = util.tokenObjectBuilder();
                        tokenObject.phoneNumber = userData.phoneNumber;
                        const newToken = tokenObject.token;
                        tokenObject = JSON.stringify(tokenObject);
                        
                        // upload new token for user
                        _data.create(`tokens/${phoneNumber}`, newToken, tokenObject, ((statusCode, tokenPaylod) =>{
                            if (statusCode === 200) {
                                callback(200, tokenPaylod);
                            } else {
                                callback(tokenPayload.code, util.errorUtility(tokenPayload.code, tokenPayload.message));
                            }
                        }));                   
                    } else {
                        callback(tokenPayload.code, util.errorUtility(tokenPayload.code, tokenPayload.message));
                    }
                }));
            }
        }));

    } else {
        callback(400,util.errorUtility(400, 'Missing required field(s)', 'Authorization' ));
    }
});



// Initiate checks object
handlers._checks = {};

// POST - Create checks for logged in user
// @Acces private
// Required: protocol, method, successCode, timeoutSeconds, url
handlers._checks.post = ((data, callback) => {
    // Pull token
    const token = typeof(data.queryStrings.token.trim()) === 'string' && data.queryStrings.token.trim().length === util.tokenRounds ? 
        data.queryStrings.token :
        false;

    // Validate token
    util.tokenValidator
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