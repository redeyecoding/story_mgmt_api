/*
    Utilties
*/
'use strict'

// Dependencies
require('../https/config');
const crypto = require("crypto");
const secret = process.env.HASH_PASSWORD_SECRET;
const _data = require('../lib/data');
const config = require('../config');


// @TODO REFACTOR THIS CODE ( SPLIT UP "like" functions into separate utility files)

// JSON parser
const jsonParser = string => {
    if (string === '') {
        null
    } else {
       return JSON.parse(string)
    }   
};

// Error utility
const errorUtility = (( statusCode, message, errorType=null ) => {
    // Assemble statusMessage Object
    const errorObject = {
        error: {
            message: message,
            code: statusCode,
            type: errorType
        },
        ok: {
            message: message,
            code: statusCode
        }
    };

    const jsonResponse = statusCode === 200 ? errorObject.ok : errorObject.error;
    return jsonResponse;
});

const generateHashPassword = password => {
    /** Hashing algorithm sha512 */
    if (typeof(password) === 'string' && password.length > 0) {
        const hash = crypto.createHmac('sha512', config.hashingSecret)
            .update(password)
            .digest('hex');
        return hash;
   } else {
       return false;
   }
};


// Token Generator
const tokenRounds = 40;
const tokenGenerator = (rounds=tokenRounds) => {
    const chars = 'abcdefghijklmnopqrstuvwx()!*yz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';

    for (let i=0; i <= rounds; i++) {
        let randomNumber = Math.floor(Math.random() * chars.length);
        token += chars[randomNumber];
    }
    return token;
};


// Token Validator
const tokenValidator = (( token, payload, phoneNumber, expiresIn=3600 ) => {
    // verify if token provided is valid and matches existing user in database
    const startTime = token === payload.token && phoneNumber === payload.phoneNumber 
        ? payload.validFrom : 
        false;

    if (startTime) {
        const mill = Date.now() - startTime;
        const timelapse = Math.floor(mill / 1000 );
        const tokenIsValid = timelapse >= expiresIn ? false : true;
        return tokenIsValid;
    };
    return false;
 });


  // Token Object builder
 // @desc used for building initial token object.
 const resetValidToken = () => Date.now();


 // Token Object builder
 // @desc used for building initial token object.
 const tokenObjectBuilder = () => {
    // Set expiration time for token
    const startTime = Date.now();
    const milliseconds = Date.now() - startTime;
    const seconds = 3600;
    const expires = Math.floor(milliseconds / 1000) + seconds;

    const tokenObject = {
        token: tokenGenerator(),
        validFrom: startTime,
        expires: expires
    };
    return tokenObject;
 };


 // User Authorization checker
 // @Desc This checked to see if a user is authorized to access protected routes.
//  const checkValidity = (( data, userData, userId=data.queryStrings.id) => {
//     // Extract token, userId - check if both are valid
//     const { validFrom } = userData.token;    
//     const tokenIsValid = tokenValidator(validFrom);
//     const authorized = tokenIsValid && userId === userData.id ? true : false; 
//     return authorized
// });


module.exports = {
    'jsonParser': jsonParser,
    'errorUtility': errorUtility,
    'generateHashPassword': generateHashPassword,
    'tokenGenerator': tokenGenerator,
    'tokenValidator': tokenValidator,
    'tokenObjectBuilder': tokenObjectBuilder,
    'resetValidToken': resetValidToken
};


