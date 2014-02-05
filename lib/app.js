var express = require('express');
var fs      = require('fs');
var hbs     = require('hbs');
var path    = require('path');
var promise = require('./../lib/promise/promise');
var routes  = require('./../lib/routes');

// Create an express application
var app = express();

function Application(app, config)
{
    var self = this;

    // Variables
    self.app = app;
    self.config = config;

    // Application setup
    self.app.engine('tpl', hbs.__express);
    self.app.set('views', path.join(__dirname, './../public/view/'));

    // Use middleware
    self.app.use(express.bodyParser());
    self.app.use(app.router);
    self.app.use(express.static(path.join(__dirname, './../public/asset/')));

    // Set up main route
    routes.init(this);

    var io = require('socket.io').listen(app.listen(3000));

    io.sockets.on('connection', function (socket) {

        var dash = fs.readFileSync(__dirname + "/../store/db.cache", 'utf8');

        socket.emit('sync', dash);

        socket.on('persist', function (data) {
            fs.writeFile(__dirname + "/../store/db.cache", JSON.stringify(data), function (err) {
                if (!err) {
                    socket.emit('saved', {});
                    io.sockets.emit('sync', JSON.stringify(data));
                }
            })
        });

    });
}

module.exports.init = function (config) {
    return new Application(app, config);
};