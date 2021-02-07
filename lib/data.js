/*
    Library for process data
*/

// Dependencies
const fs = require('fs');


// Setup default path
const dir = __dirname;

// Initilize lib Object
const lib = {};


// Create files
lib.create = (( data, callback ) => {
    // Extract data 
    console.log('DATA SECTION',data.payload);
    callback(200);
    

});

module.exports = lib;