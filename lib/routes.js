var fs      = require('fs');
var path    = require('path');
var http    = require('http');
var url     = require('url');

module.exports.init = function (app) {

    app.app.get('/api/json', function (req, res) {
        var content = fs.readFileSync(__dirname + "/stage/test.json", 'utf8');
        setTimeout(function() {
            res.send(content);
        }, 1000);
    });

    app.app.get('/render', function (req, res) {
        var content = fs.readFileSync(__dirname + "/stage/graphite.json", 'utf8');
        setTimeout(function() {
            res.send(content);
        }, 1000);
    });

    app.app.post('/forward', function (req, res) {
        var path = req.body.path;
        var host = req.body.host;

        // Parse the URL
        var temp = (host + '' + path).replace(/\n/g, "");
        var parse = url.parse(temp);

        // Find the port
        var port = 80;
        if (typeof parse.port !== 'undefined') {
            port = parse.port;
        }

        // Set up options
        var options = {
            hostname: parse.hostname,
            port: port,
            path: parse.pathname + parse.search,
            method: "GET"
        };

        http.request(options, function (resp) {
            var data = "";

            resp.on('data', function (chunk) {
                data += chunk;
            });

            resp.on('end', function () {
                res.send(data);
            });
        }).on("error", function (e) {
            // TODO error
            console.error(e);
            console.error(req.body);
            res.send({});
        }).end();
    });

    app.app.get('/', function (req, res) {
        return res.render('index.tpl', []);
    });

    app.app.get('/api/settings', function (req, res) {
        return res.send(JSON.stringify(app.config.settings));
    });

    app.app.post('/api/settings', function (req, res) {

        app.config.settings = req.body.settings;

        var buffer = JSON.stringify(app.config);

        fs.writeFileSync(
            path.join(__dirname, './../config.json'),
            buffer
        );

        return buffer;
    });

}