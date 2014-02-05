// Require dependencies
var app     = require('./../lib/app');
var fs      = require('fs');
var path    = require('path');
var promise = require('./../lib/promise/promise');

// Override error handling
//require('./../lib/debug');

// Setup dependencies
var config = {}

// Handle the parsing of the configuration file.
var loadConfig = function (pledge) {

    pledge.success();
    /*
    fs.readFile(
        path.join(__dirname, './../config.json'),
        'utf8',
        function(err, data) {

            if (!err) {
                config = JSON.parse(data);
                pledge.success();
            } else {
                pledge.fail('config file not found');
            }
        }
    );
    */
}

// Boot up the application
promise
    .create()
    .pledge(loadConfig)
    .then(function (err, state) {

        if (state) {
            // Start the application
            app.init(config);
        } else {

            console.error('boot failure. (' + err + ')');
            process.exit(1);
        }
    });

// Handle any dodgy errors
process.on('uncaughtException', function(err) {
    console.log(err);
});