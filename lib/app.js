var express = require('express');
var fs      = require('fs');
var hbs     = require('hbs');
var promise = require('./../lib/promise/promise');
var routes  = require('./../lib/routes');
var args    = require('optimist').argv;

// Create an express application
var app = express();

function Application(app, assets)
{
    var self = this;

    // Variables
    self.app = app;
    self.assets = assets;
    self.assetBody = [];
    self.store = "";
    self.port = 3000;

    // Check if port was specified
    if (args.p) {
        self.port = args.p;
    }

    // Application setup
    self.app.engine('tpl', hbs.__express);
    self.app.set('views', __dirname + './../public/view/');

    // Use middleware
    self.app.use(express.bodyParser());
    self.app.use(app.router);
    self.app.use(express.static(__dirname + './../public/asset/'));

    // Custom middleware to handle asset response
    self.app.use(function (req, res, next) {

        if (req.url == '/graphique/core.js') {
            res.send(self.assetBody.join("\n\n"));
        } else {
            next();
        }
    });

    // Set up custom dashboard route handler
    self.app.use(function (req, res, next) {
        console.log('request dashboard: ' + req.url);
        return res.render('index.tpl', []);
    });

    // Set up main route
    routes.init(this);

    // Set up the socket bind method (private)
    var bind = function (io) {
        io.sockets.on('connection', function (socket) {

            socket.on('subscribe', function (data) {
                socket.dashboard = data;

                if (typeof self.store[socket.dashboard] !== 'undefined') {
                    socket.emit('sync', { dashboard: socket.dashboard, data: self.store[socket.dashboard] });
                } else {
                    socket.emit('notFound', { dashboard: socket.dashboard });
                }

                socket.on('persist', function (data) {
                    console.log('saving dashboard: ' + socket.dashboard);
                    self.store[socket.dashboard] = data;

                    socket.emit('saved', {});
                    io.sockets.emit('sync', { dashboard: socket.dashboard, data: self.store[socket.dashboard] });

                    // Persist the dashboard
                    fs.writeFile(__dirname + "/../store/db.cache", JSON.stringify(self.store), function (err) {
                        if (err) {
                            console.error('unable to persist dashboard: ' + err);
                        }
                    })
                });

            });

        });
    }

    // Pledge a promise to do all preparation work
    // asynchronously
    var assetPromise = promise.create();

    // Load up the db.cache
    assetPromise.pledge(function (pledge) {
        fs.readFile(__dirname + "/../store/db.cache", 'utf8', function (err, data) {
            if (!err) {
                self.store = JSON.parse(data);
                return pledge.success();
            }

            return pledge.fail('unable to load dashboard');
        });
    });

    // Pledge all the assets and compile them all into one body.
    for (var key in assets) {
        assetPromise.pledge(function (pledge, file, pos) {
            fs.readFile(file, 'utf8', function (err, data) {
                if (!err) {
                    self.assetBody[pos] = data;
                    return pledge.success();
                }

                return pledge.fail('unable to load asset (' + file + ')');
            });
        }, [assets[key], key]);
    }

    // Run the promise object
    assetPromise.then(function (err, state) {

        if (state) {
            // Listen on the application port
            console.info('start on port ' + self.port);
            var io = require('socket.io').listen(app.listen(self.port));
            io.set("log level", 1);

            bind(io);

        } else {
            console.error('boot failure. (' + err + ')');
            process.exit(1);
        }
    });
}

module.exports.init = function (assets) {
    return new Application(app, assets);
};