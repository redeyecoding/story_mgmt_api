/*
    Utilties
*/
'use strict'

// Dependencies
require('../https/config');
const crypto = require("crypto");
const secret = process.env.HASH_PASSWORD_SECRET;
const _data = require('../lib/data');


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


// Hash password utility
    // Generate Salt
const genRandomString = length => {
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};


const sha512 = (password, salt) => {
    const hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    const value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

const generateHashPassword = userpassword => {
    const salt = genRandomString(16); /** Gives us salt of length 16 */
    const passwordData = sha512(userpassword, salt);
    const hash = passwordData.salt += passwordData.passwordHash
    return hash;
};



// Token Generator
const tokenRounds = 40;
const tokenGenerator = (rounds=tokenRounds) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';

    for (let i=0; i <= rounds; i++) {
        let randomNumber = Math.floor(Math.random() * chars.length);
        token += chars[randomNumber];
    }
    return token;
};


// Token Validator
const tokenValidator = (( token, payload, expiresIn=3600 ) => {
    // verify if token provided is valid
    const startTime = token === payload.token.token ? payload.token.validFrom : false;

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
 const checkValidity = (( data, userData, userId=data.queryStrings.id) => {
    // Extract token, userId - check if both are valid
    const { validFrom } = userData.token;    
    const tokenIsValid = tokenValidator(validFrom);
    const authorized = tokenIsValid && userId === userData.id ? true : false; 
    return authorized
});


module.exports = {
    'jsonParser': jsonParser,
    'errorUtility': errorUtility,
    'generateHashPassword': generateHashPassword,
    'tokenGenerator': tokenGenerator,
    'tokenValidator': tokenValidator,
    'tokenObjectBuilder': tokenObjectBuilder,
    'checkValidity': checkValidity
};


