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
        'envMode': process.env.NODE_ENV
    },
    httpsConfig: {
        'httpsPort': httpsPort,
        'envMode': process.env.NODE_ENV
    }
};

module.exports = config;