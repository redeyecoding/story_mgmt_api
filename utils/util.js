/*
    Utilties
*/
'use strict'

// Dependencies
require('../https/config');
const crypto = require("crypto")
const secret = process.env.HASH_PASSWORD_SECRET;



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
    const chars = 'abcdefghijklmnopqrstuvwxyz123456789)(*&^%$#@!ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';

    for (let i=0; i <= rounds; i++) {
        let randomNumber = Math.floor(Math.random() * chars.length);
        token += chars[randomNumber];
    }
    return token;
};


// Token Validator
const tokenValidator = (( startTime, expires=60 ) => {
    let mill = Date.now() - startTime;
    let timelapse = Math.floor(mill / 1000 );
    let tokenIsValid = timelapse >= expires ? false : true;
    return tokenIsValid;
 });


 // Token Object builder
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

module.exports = {
    'jsonParser': jsonParser,
    'errorUtility': errorUtility,
    'generateHashPassword': generateHashPassword,
    'tokenGenerator': tokenGenerator,
    'tokenValidator': tokenValidator,
    'tokenObjectBuilder': tokenObjectBuilder
};


