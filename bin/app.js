// Require dependencies
var app     = require('./../lib/app');
var fs      = require('fs');

// Override error handling
require('./../lib/debug');

// Set asset config
var assets = [
    __dirname + '/../lib/render/third/jquery.js',
    __dirname + '/../lib/render/third/bootstrap.js',
    __dirname + '/../lib/render/third/gridly.js',
    __dirname + '/../lib/render/third/jquery.flot.js',
    __dirname + '/../lib/render/third/jquery.flot.stack.js',
    __dirname + '/../lib/render/third/jquery.flot.time.js',
    __dirname + '/../lib/render/third/knockout.js',
    __dirname + '/../lib/render/inheritance.js',
    __dirname + '/../lib/render/queue.js',
    __dirname + '/../lib/render/settings.js',
    __dirname + '/../lib/render/field.js',
    __dirname + '/../lib/render/core.js',
    __dirname + '/../lib/render/panel.js',
    __dirname + '/../lib/render/widget.js'
];

// Boot up the application
app.init(assets);

// Handle any dodgy errors
process.on('uncaughtException', function(err) {
    console.log(err);
});