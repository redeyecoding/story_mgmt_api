/*
    Library for process data
*/
'use strict'


// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('../utils/util');


// Setup default path
const basePath = path.join(__dirname, '../.data/');

// Initilize lib Object
const lib = {};


// Read user data
lib.read = ((dir, phoneNumber, callback) => {
    // Read data drom file
    fs.readFile(`${basePath}${dir}/${phoneNumber}.json`,'utf8', (( err, userData ) => {
        if (err) {
            // Hide password from response.            
            callback(400, util.errorUtility(400, 'User not found', 'Registration' ));            
        } else {
            userData = util.jsonParser(userData);
            callback(200, userData );
        }
    }));
});


// Create files
// Required: phone number, firstName, lastName, tosAgreement
// optional: , email
lib.create = ((dir, phoneNumber, data, callback ) => {
    // Validate information recieved from the user
    fs.open(`${basePath}${dir}/${phoneNumber}.json`, 'wx', (err, fileDescriptor) => {
        if (!err) {
            // Write the data to the opened file
            fs.writeFile(`${basePath}${dir}/${phoneNumber}.json`, data, (err, fileDescriptor) => {                
                if (!err) {
                    callback(200,
                        util.errorUtility(200, 'OK'));
                } else {
                    callback(500, 
                        util.errorUtility(500, 'Server Error: Could not write to file', 'fileProcessing')
                    );
                }
            });
        } else {
            callback(400, 
                util.errorUtility(400, 'File already exists', 'fileProcessing' ));
        }
    });
});



// Update files
// Required: phone number
// optional: firstName, lastName, email
// @TODO Only authenticated users can edit their-own accounts; no one elses.
lib.update = (( dir, phoneNumber, userData, callback ) => {
    // Open the file
    fs.open(`${basePath}${dir}/${phoneNumber}.json`, 'r+', (err, fileDescriptor) => {
        if (!err) {  
            // Pull existing data
            fs.truncate(`${basePath}${dir}/${phoneNumber}.json`,(err => {
                if (err){
                    callback(500, util.errorUtility(200, 'Internal Server Error', 'fileProcessing'));
                } else {
                                    // Write the data to the opened file
                    fs.writeFile(`${basePath}${dir}/${phoneNumber}.json`, userData, (err, fileDescriptor) => {                
                        if (!err) {
                            callback(200,
                                util.errorUtility(200, 'OK'))
                        } else {
                            callback(500, 
                                util.errorUtility(500, 'Server Error: Could not write to file', 'fileProcessing')
                            );
                        }
                    });
                }
            }));
        } else {
            callback(400, 
                util.errorUtility(400, 'File does not exist', 'fileProcessing' ));
        }
    });
});


// Delete file from directory
// Required: phone number and id ( valid token )
// @TODO Only authenticated users can delete their accounts;no one elses.
lib.delete = (( dir, phoneNumber, callback ) => {
    // Delete account
    fs.unlink(`${basePath}${dir}/${phoneNumber}.json`, (err) => {
        if (err) {
            callback(204, 
                util.errorUtility(204, 'Could not delete file. The file probably does not exist', 'fileProcessing')
            );
        } else {
            callback(200, 
                util.errorUtility( 200,'Ok' )
            );
        }
    })
});

module.exports = lib;