/* 
    main api configuration
    // Default environment mode is STAGING

*/

// Dependencies
const fs = require('fs');
const httpsCert = fs.readFileSync('./https/cert.pem', 'utf8');
const httpsKey = fs.readFileSync('./https/key.pem', 'utf8');


// Define environment settings
const envMode = process.env.NODE_ENV === 'staging'.trim()  ? 'staging' : 'production'
const httpPort = process.env.NODE_ENV === 'staging'.trim() ? 3000 : 3001;
const httpsPort = process.env.NODE_ENV === 'staging'.trim() && httpsCert && httpsKey ? 5000 : 5001;


// Initialize configuration object
const config = {
    httpConfig: {
        'httpPort': httpPort,
        'envMode': envMode,        
    },
    httpsConfig: {
        'httpsPort': httpsPort,
        'envMode': envMode,
        'options': {
            cert: httpsCert,
            key: httpsKey
        }
    },
    hashingSecret: 'ljhsldjfhaushdASDHFIH284h@#$H%@IUHVWHRf89'
};

module.exports = config;