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


// Create files
// Required: phone number, firstName, lastName, tosAgreement
// optional: , email
lib.create = ((dir, data, callback ) => {
    // Extract data from user request
    let {
        firstName,
        lastName,
        email,
        phoneNumber,
        tosAgreement
    } = util.jsonParser(data);
    console.log(phoneNumber)

    // Validate information recieved from the user
    phoneNumber = phoneNumber.trim().length === 10 ? phoneNumber : false;
    tosAgreement = tosAgreement ? tosAgreement : false;
    firstName = firstName.trim().length > 0 ? firstName : false
    lastName = lastName.trim().length > 0 ? lastName : false

    if ( phoneNumber && tosAgreement && firstName && lastName ) {
        // Open the file
        fs.open(`${basePath}${dir}/${phoneNumber}.json`, 'wx', (err, fileDescriptor) => {
            if (!err) {
                // Write the data to the opened file
                fs.writeFile(`${basePath}${dir}/${phoneNumber}.json`, data, (err, fileDescriptor) => {                
                    if (!err) {
                        callback(200,
                            util.errorUtility(200, 'OK'))
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
    } else {
        callback(400, 
            util.errorUtility(400, 'Missing required fields', 'fileProcessing' ));
    }

});



// Update files
// Required: phone number
// optional: firstName, lastName, email
// @TODO Only authenticated users can edit their-own accounts; no one elses.
lib.update = (( dir, data, callback ) => {
    // Verify that the user is authenticate    
        if (true) {
                // Extract data from user request

        // @TODO CREATE A UTILITY FOR THIS
        let {
            firstName,
            lastName,
            email,
            phoneNumber,
            tosAgreement
        } = util.jsonParser(data);
        console.log(phoneNumber)

        // Validate information recieved from the user
        phoneNumber = phoneNumber.trim().length === 10 ? phoneNumber : false;
        tosAgreement = tosAgreement ? tosAgreement : false;
        firstName = firstName.trim().length > 0 ? firstName : false;
        lastName = lastName.trim().length > 0 ? lastName : false;


        // Open the file
        fs.open(`${basePath}${dir}/${phoneNumber}.json`, 'r+', (err, fileDescriptor) => {
            if (!err) {                
                fs.truncate(`${basePath}${dir}/${phoneNumber}.json`,(err => {
                    if (err){
                        callback(500, util.errorUtility(200, 'Internal Server Error', 'fileProcessing'));
                    } else {
                                        // Write the data to the opened file
                        fs.writeFile(`${basePath}${dir}/${phoneNumber}.json`, data, (err, fileDescriptor) => {                
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
    } else {
        callback(401,util.errorUtility(401, 'Not Authorized', 'Authorization' ));
    }   
});


// Delete file from directory
// Required: phone number
// @TODO Only authenticated users can delete their accounts;no one elses.
lib.delete = (( dir, data, callback ) => {
    // Extract userData
    const {
        phoneNumber
    } = util.jsonParser(data.payload)

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