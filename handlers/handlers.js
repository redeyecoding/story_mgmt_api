/*
    Handlers
*/
'use strict'

const { stat } = require('fs');
const config = require('../config');
// Dependencies
const _data = require('../lib/data');
const util = require('../utils/util');

// @TODO DIRECTORY WILL BE CHANGED TO SOMETHING MORE DYNAMIC
// @TODO BREAK CODE UP INTO SMALLER MODULES
// @TODO RUN THROUGH APT TO PUT CORRECT STATUS CODES IN RESPONSES
// @TODO CORRECT THE RETURN VALUES FOR PUT, POST, GET AND DELETE
// @TODO  (BIG PROBLEM) cannot create multiple users. when 2nd user logs in all tokens get erased!

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

    if ( phoneNumber && token ) {
        _data.read(`tokens`, token, ((statusCode, tokenPayload) => { 
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
                            _data.update(`tokens`, token, updateTokenPayload, ((statusCode, tokenPayload) => {
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
                hashPassword: hashPassword,
                checks: []               
            };    
            userData = JSON.stringify(userData);
            
            // Create new user
            _data.create('users', phoneNumber, userData, ((statusCode, data) => {
                if (statusCode === 200) {
                    // Setup token directory for new user
                    _data.createDir(`tokens`, ((statusCode) => {
                        if (statusCode === 200) {
                            // Generate token for new user
                            let tokenData = util.tokenObjectBuilder();
                            const token = tokenData.token;
                            tokenData.phoneNumber = phoneNumber;
                            tokenData = JSON.stringify(tokenData);

                            // Add tokenData to new users directory
                            _data.create(`tokens`, token, tokenData, ((statusCode, payload) => {
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
// @TODO Create function for validating user's email-address
handlers._userDataProcessing.put = (( data, callback ) => {
    const token = data.headers.token;

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
        _data.read(`tokens`, token, ((statusCode, tokenPayload) => { 
            
            if (statusCode === 200) {
                // Fetch user's phoneNumber
                const phoneNumber = tokenPayload.phoneNumber;

                // Check if user is authorized.
                const authorized = util.tokenValidator(token, tokenPayload, phoneNumber); 

                if (authorized) {
                    // Pull current user data
                    _data.read('users', phoneNumber, ((statusCode, currentUserData) => {
                        console.log(currentUserData)
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
                                _data.update(`tokens`, token, updateTokenPayload, ((statusCode, tokenPayload) => {
                                    if (statusCode === 200) {
                                        callback(200, updatedPayload);
                                    } else {
                                        callback(500, util.errorUtility(500, 'Could not reset token expiration timer', 'Authentication'));
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
  
    if ( phoneNumber && token ) {
        _data.read(`tokens`, token, ((statusCode, tokenPayload) => { 
            if (statusCode === 200 ) {
                // Check if user is authorized.
                const authorized = util.tokenValidator(token, tokenPayload, phoneNumber); 

                if (authorized) {
                    // Delete user file 
                    _data.delete('users', phoneNumber, ((statusCode, delPayload) => {
                        if (statusCode === 200) {
                            // Delete the token associated with the user
                            _data.deleteDir(`tokens`, ((statusCode, tokenPayload) => {
                                if (statusCode === 200) {                                    
                                    callback(200,util.errorUtility(200, 'User Account deleted', 'file processing'));
                                } else {
                                    callback(500, util.errorUtility(500, 'Could not delete token for user', 'file processing'));
                                }
                            }));
                        } else {
                            callback(500, util.errorUtility(500, 'Could not delete user account.', 'file processing'));
                        }
                        }));                            
                } else{
                    callback(403, util.errorUtility(403, 'Unauthorized', 'Authentication'));
                }
            } else {
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

                // Delete the existing token (if any) and create a new one for the user.
                _data.deleteFiles(`tokens`, ((statusCode, tokenPayload) => {
                    if (statusCode === 200) {
                        // Create a new token object for the user                
                        let tokenObject = util.tokenObjectBuilder();
                        tokenObject.phoneNumber = userData.phoneNumber;
                        const newToken = tokenObject.token;
                        tokenObject = JSON.stringify(tokenObject);
                        
                        // upload new token for user
                        _data.create(`tokens`, newToken, tokenObject, ((statusCode, tokenPaylod) =>{
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


// Token Handler Object
handlers.checks = (( data, callback ) => {
    // Check for valid inbound request
    const validRequests = ['get','post','delete', 'put'];
    const method = data.method;

    if ( validRequests.includes(method) ) {
        handlers._checks[method]( data, callback );
    } else {
        callback(400, { 'Error': 'Invalid request' });
    }
});


// Initiate checks object
handlers._checks = {};

// POST - Create checks for logged in user
// @Acces private
// Required: protocol, method, successCode, timeoutSeconds, url
handlers._checks.post = ((data, callback) => {
    // Pull token
    const token = typeof(data.headers.token.trim()) === 'string' && data.headers.token.trim().length === util.tokenRounds ? 
            data.headers.token :
            false;

    let protocol = typeof(data.payload.protocol.trim()) === 'string' &&  ['http', 'https'].indexOf(data.payload.protocol.trim()) > -1 ? 
            data.payload.protocol.trim() :
            false;

    let url = typeof(data.payload.url.trim()) === 'string' && data.payload.url.trim() ? 
            data.payload.url.trim() :
            false;

    let method = typeof(data.payload.method.trim()) === 'string' &&  ['get', 'post', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? 
            data.payload.method.trim() :
            false;

    let successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? 
            data.payload.successCodes : false;

    let timeOutSeconds = typeof(data.payload.timeOutSeconds) === 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= config.maxTimeout ? 
            data.payload.timeOutSeconds :
            false;

    if (token) {
        _data.read(`tokens`, token, ((statusCode, tokenData) => {
            if (statusCode === 200) {            
                if (protocol && url && method && successCodes && timeOutSeconds) {
                    const phoneNumber = tokenData.phoneNumber;

                    // Check if user is authorized
                    const authorized = util.tokenValidator(token, tokenData, phoneNumber);

                    // Check if number of checks is less than max
                    _data.read('users', phoneNumber, ((statusCode, userData) => {
                        if (statusCode === 200) {
                            const validChecks = typeof(userData.checks) === 'object' && userData.checks.length < config.maxChecks ? true : false;

                            if (validChecks) {
                                if (authorized) {
                                    // Instantiate checks Object
                                    let checksObject = {
                                        id: util.tokenGenerator(20),
                                        protocol: protocol,
                                        url: url,
                                        method: method,
                                        successCodes: successCodes,
                                        timeOutSeconds: timeOutSeconds
                                    };
                                    const checkId = checksObject.id;

                                    // Add check id to user file
                                    let updatedUserData = {
                                        ...userData,
                                        checks: userData.checks.concat(checkId)
                                    };
                                    updatedUserData = JSON.stringify(updatedUserData);

                                    _data.update('users', phoneNumber, updatedUserData, ((statusCode, checkData) => {
                                        if (statusCode === 200) {
                                            // Setup User check directory
                                            checksObject = JSON.stringify(checksObject);
                
                                            // Create Check directory for user
                                            _data.createDir(`checks/${phoneNumber}`, (statusCode) => {
                                                if (statusCode === 200) {   

                                                    // Add checks to directory for user
                                                    _data.create(`checks/${phoneNumber}`, checkId, checksObject, (( statusCode, checkData ) => {
                                                        if (statusCode === 200) {
                                                            callback(201, checkData);
                                                        } else {
                                                            callback(500, util.errorUtility(500, 'Could not add checks to user directory', 'Check data processing.'));
                                                        }
                                                    }));
                                                } else {
                                                    callback(500, util.errorUtility(500, 'Could not create directory for user.', 'Check creation'));
                                                }
                                            }); 
                                        } else {
                                            callback(500, util.errorUtility(500, 'Could not add check Id to user profile.', 'Check creation'));
                                        }
                                    }));
                              
                                } else {
                                    callback(403, util.errorUtility(403, 'Missing or invalid token', 'Authentication'));
                                }
                            } else {
                                callback(400, util.errorUtility(400, `User reached max checks. ${config.maxChecks}`, 'Check creation'));
                            }
                        } else {
                            callback(500, util.errorUtility(500, 'Could not generate check for user.', 'Check creation'));
                        }
                    }));
                } else {
                    callback(403, util.errorUtility(403, 'Missing valid field(s)', 'checks'));
                }
            } else {
                callback(403, util.errorUtility(403, 'Missing or invalid token', 'Authentication'));
            }
        }));
    } else {
        callback(403, util.errorUtility(403, 'Missing or invalid token', 'Authentication'));
    }
     
    

    // Validate token
    util.tokenValidator
});


// PUT - Edit check
// @Acces private
// Required: checkID and At least one: protocol, method, successCode, timeoutSeconds, url
handlers._checks.put = ((data, callback) => {
    //  Fetch token 
    const token = typeof(data.headers.token.trim()) === 'string' && data.headers.token.trim().length === util.tokenRounds ? 
        data.headers.token :
        false;

    let protocol = data.payload.protocol !== undefined &&
                    typeof(data.payload.protocol) === 'string' &&  
                    ['http', 'https'].indexOf(data.payload.protocol.trim()) > -1 ? 
                    data.payload.protocol.trim() :
                    false;

    let url = data.payload.url !== undefined && 
                typeof(data.payload.url.trim()) === 'string' && 
                data.payload.url.trim() ? 
                data.payload.url.trim() :
                false;

    let method = data.payload.method !== undefined &&
                    data.payload.method.trim() === 'string' &&  
                    ['get', 'post', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? 
                    data.payload.method.trim() :
                    false;

    let successCodes = data.payload.successCodes !== undefined &&
                        typeof(data.payload.successCodes) === 'object' && 
                        data.payload.successCodes instanceof Array && 
                        data.payload.successCodes.length > 0 ? 
                        data.payload.successCodes : 
                        false;

    let timeOutSeconds = data.payload.timeOutSeconds !== undefined &&
                            typeof(data.payload.timeOutSeconds) === 'number' &&
                            data.payload.timeOutSeconds % 1 === 0 &&
                            data.payload.timeOutSeconds >= 1 &&
                            data.payload.timeOutSeconds <= config.maxTimeout ? 
                            data.payload.timeOutSeconds :
                            false;

    let checkId = typeof(data.payload.checkId.trim()) === 'string' && data.payload.checkId.trim().length === 20 ?
        data.payload.checkId.trim() :
        false;

    // Validate the token
    if (token) {
        _data.read(`tokens`, token, ((statusCode, tokenPayload) => {
            if (statusCode === 200) {            
                if (checkId & protocol || url || method || successCodes || timeOutSeconds) {
                    const phoneNumber = tokenPayload.phoneNumber;
                    
                    // Check if user is authorized
                    const authorized = util.tokenValidator(token, tokenPayload, phoneNumber);

                    if (authorized) {
                         // Validate check id sent belongs to the user who sent it 
                        _data.read('users', phoneNumber, ((statusCode, userData) => {
                            if (statusCode === 200) {
                                const checkIdIsValid = userData.checks.includes(checkId);

                                if (checkIdIsValid) {
                                    // Fetch the check
                                    _data.read(`checks/${phoneNumber}`, checkId, ((statusCode, checkData) => {
                                        if (statusCode === 200) {
                                            // Update check Data             
                                            let updatedCheck = { ...checkData };

                                            if (protocol) updatedCheck.protocol = protocol;
                                            if (url) updatedCheck.url = url;
                                            if (method) updatedCheck.method = method;
                                            if (successCodes) updatedCheck.successCodes = successCodes;
                                            if (timeOutSeconds) updatedCheck.timeOutSeconds = timeOutSeconds;

                                            updatedCheck = JSON.stringify(updatedCheck);

                                            // Update the user's check 
                                            _data.update(`checks/${phoneNumber}`, data.payload.checkId, updatedCheck, ((statusCode, checkData) => {
                                                if (statusCode === 200) {
                                                    // Update the user's token expiration time
                                                    let updateTokenPayload = {
                                                        ...tokenPayload,
                                                        validFrom: util.resetValidToken()
                                                    };
                                                    updateTokenPayload = JSON.stringify(updateTokenPayload);

                                                    // Upload the new tokenPayload
                                                    _data.update(`tokens`, token, updateTokenPayload, ((statusCode, tokenPayload) => {
                                                        if (statusCode === 200) {
                                                            callback(201, checkData);
                                                        } else {
                                                            callback(500, util.errorUtility(500, 'Could not reset token expiration timer', 'Authentication'));
                                                        }
                                                    }));
                                                } else {
                                                    callback(500, util.errorUtility(500, 'Could not update check for user.', 'Check creation'));
                                                }
                                            }));
                                        }
                                    }));                                   
                                } else {
                                    callback(401, util.errorUtility(401, `Invalid checkId`, 'Check update'));
                                }
                            } else {
                                callback(500, util.errorUtility(500, 'Could not generate check for user.', 'Check creation'));
                            }
                        }));
                    } else {
                        callback(401, util.errorUtility(403, 'Could not match token with user', 'Authorization'));
                    }
                } else {
                    callback(400, util.errorUtility(400, 'Missing valid field(s).', 'checks'));
                }
            } else {
                callback(403, util.errorUtility(403, 'Missing or invalid token', 'Authentication'));
            }
        }));
    } else {
        callback(403, util.errorUtility(403, 'Missing or invalid token', 'Authentication'));
    }
});



// GET - Get token
// @Acces private
// Required: token, checkId
handlers._checks.get = ((data, callback) => {

});










// DELETE - Delete check from check list
// @Access private
// Required: token
handlers._checks.delete = ((data, callback) => {

});







module.exports = handlers;