/* 
    main api configuration
*/

// Default environment mode is staging

// Set enviorment ports
const httpPort = process.env.NODE_ENV.trim() === 'staging'.trim() ? 3000 : 3001;
const httpsPort = process.env.NODE_ENV.trim() === 'production'.trim() ? 5000 : 5001;


// Initialize configuration object
const config = {
    httpConfig: {
        'httpPort': httpPort,
    },
    httpsConfig: {
        'httpsPort': httpsPort,
    }
};



// Check to see if the current node 'mode' is production or stage
// const getEnvironmentType = process.env.NODE_ENV.trim() === 'staging'.trim() ? 

module.exports = config;