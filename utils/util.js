/*
    Utilties
*/
'use strict'

// Dependencies
require('../https/config');
const crypto = require("crypto")
const secret = process.env.HASH_PASSWORD_SECRET;



// Error utility
const jsonParser = string => {
    if (string === '') {
        null
    } else {
       return JSON.parse(string)
    }
    
};
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
    return JSON.stringify(jsonResponse);
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

module.exports = {
    'jsonParser': jsonParser,
    'errorUtility': errorUtility,
    'generateHashPassword': generateHashPassword
};


