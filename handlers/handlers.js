/*
    Handlers
*/
'use strict'

// Dependencies
const _data = require('../lib/data');
const util = require('../utils/util');



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


// Read user data
// required: phoneNumber, id
// @Access Private
// @TODO only authenticated users should be able to read their data and only their data.
handlers._userDataProcessing.get = (( data, callback ) => {
    const phoneNumber = typeof(data.queryStrings.phoneNumber) === 'string' && 
        data.queryStrings.phoneNumber.trim().length === 10 ? 
        data.queryStrings.phoneNumber : 
        false;
    
        // @TODO Validate authenticated users
        // check if phone number
        _data.read( 'users', phoneNumber, callback );
});



// Update files
// Required: phone number
// optional: firstName, lastName, email
// @TODO Only authenticated users can edit their-own accounts; no one elses.
handlers._userDataProcessing.post = (( data, callback ) => {
    // Create user profile
        //@TODO Move this to Handlers as users should be authenticated before file processing
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
            // Open the file
            _data.create('users', phoneNumber, userData, callback)
    
        } else {
            callback(400, 
                util.errorUtility(400, 'Missing required fields', 'fileProcessing' ));
        };
});


handlers._userDataProcessing.put = (( data, callback ) => {
    // Verify that the user is authenticate    
    if (true) {
        // Extract data from user request
        // @TODO CREATE A UTILITY FOR THIS
        // Validate information recieved from the user
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


        // @TODO CREATE A UTILITY FOR THIS
        let userData = {
            phoneNumber :phoneNumber,
            firstName: firstName,
            lastName: lastName,
            tosAgreement: tosAgreement,
        };

        //@TODO CREATE LOGIC FOR HOLDING EXISITING PASSWORD
        userData = JSON.stringify(userData);

        // Update file
        _data.update('users',phoneNumber, userData, callback);

} else {
    callback(403,util.errorUtility(403, 'Forbidden', 'Authorization' ));
} 

});


// Delete file from directory
// Required: phone number and id ( valid token )
// @TODO Only authenticated users can delete their accounts;no one elses.
handlers._userDataProcessing.delete = (( data, callback ) => {
    // Extract userData
    const phoneNumber = data.payload.phoneNumber
    // Delete user file
    _data.delete('users',phoneNumber, callback);
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

// GET - Create token for logged in user
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
            // @TODO Create function to check if phoneNumber is assigned to existing user ( returns Boolen )
    if (password && phoneNumber) {
        // look up user and validate phone number
        _data.read('users', phoneNumber, ((statusCode, data) => {
            if (statusCode !== 200) {
                callback(data.code, data);
            } else {
                 // provide token
                 const token = util.tokenGenerator();
                 _data.create('tokens', phoneNumber, token );
                
                callback(statusCode, data);
            }
            // Create a json file labeled with the user's token
        }));

    } else {
        callback(400,util.errorUtility(400, 'Missing required fields', 'Authentication'));
    }
});




module.exports = handlers;