/*
    Library for process data
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('../utils/util');


// Setup default path
const basePath = path.join(__dirname, '../.data/');

// Initilize lib Object
const lib = {};


// Check for required fields to register user
const registerVerification = ((data, callback) => {

});

// Create files
lib.create = ((dir, data, callback ) => {
    // Extrac data from user request
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        tosAgreement
    } = util.jsonParser(data);


    // Open the file
    fs.open(`${basePath}${dir}/${phoneNumber}.json`, 'wx', (err, fileDescriptor) => {
        if (!err) {
            console.log(data)
            // Write the data to the opened file
            fs.writeFile(`${basePath}${dir}/${phoneNumber}.json`, data, (err, fileDescriptor) => {                
                if (!err) {
                    callback(200,
                        util.errorUtility(200, 'OK'))
                } else {
                    callback(500, 
                        util.errorUtility(500, 'Server Error: Could not write to file', 'fileProcessing')
                    );
                    // callback(500, { 'Error': 'Server Error: Could not write to file' });
                }
            });
        } else {
            callback(400, 
                util.errorUtility(400, 'Could not open file. It already exists', 'fileProcessing' ));
        }
    });
});



// Update files
lib.update = (( dir, callback ) => {
    // Delete file from directory
    fs.unlink(`${basePath}${dir}/file10.json`, (err) => {
        if (err) {
            callback(201, 
                util.errorUtility(201, 'Could not delete file. The file probably does not exist', 'fileProcessing')
            );
        } else {
            callback(200, 
                util.errorUtility( 200,'Ok' )
            );
        }
    })
});

// Delete files
lib.delete = (( dir, data, callback ) => {
    // Extract userData
    const {
        phoneNumber
    } = data
    console.log(dir);

    // Delete file from directory
    fs.unlink(`${basePath}${dir}/${phoneNumber}.json`, (err) => {
        if (err) {
            callback(201, 
                util.errorUtility(201, 'Could not delete file. The file probably does not exist', 'fileProcessing')
            );
        } else {
            callback(200, 
                util.errorUtility( 200,'Ok' )
            );
        }
    })
});



module.exports = lib;