/*
    Utilties
*/

const jsonParser = string => JSON.parse(string);

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
    }

    const jsonResponse = statusCode === 200 ? errorObject.ok : errorObject.error;
    return JSON.stringify(jsonResponse);
});


module.exports = {
    'jsonParser': jsonParser,
    'errorUtility': errorUtility
}


