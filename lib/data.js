/*
    Library for process data
*/

// Dependencies
const fs = require('fs');
const path = require('path');

// Setup default path
path.join(__dirname, '../../.data/');


// Initilize lib Object
const basePath = path.join(__dirname, '../.data/');
const lib = {};



// Create files
lib.create = ((dir, data, callback ) => {
    // Extract data 
    // const {
    //     payload
    // } = 
    console.log(typeof(data));
    fs.writeFile(`${basePath}${dir}/file1.json`, data.payload, (err, fileDescriptor) => {
        if (!err) {
            callback(200, data);
        } else {
            callback(400, { 'Error': err });
        }
    })
});

module.exports = lib;