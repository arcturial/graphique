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

    // Set up main route
    routes.init(this);

    // Set up the socket bind method (private)
    var bind = function (io) {
        io.sockets.on('connection', function (socket) {

            socket.emit('sync', self.store);

            socket.on('persist', function (data) {
                fs.writeFile(__dirname + "/../store/db.cache", JSON.stringify(data), function (err) {
                    if (!err) {
                        self.store = JSON.stringify(data);
                        socket.emit('saved', {});
                        io.sockets.emit('sync', self.store);
                    }
                })
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
                self.store = data;
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
            console.log('start on port ' + self.port);
            var io = require('socket.io').listen(app.listen(self.port));
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