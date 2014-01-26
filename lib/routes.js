var fs      = require('fs');
var path    = require('path');

module.exports.init = function (app) {


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