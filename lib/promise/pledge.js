var util = require('util'),
EventEmitter = require('events').EventEmitter;

function Pledge(method)
{
    var self = this;

    var pledge = {
        success: function () {
            self.emit('done', true, '');
        },
        fail: function (message) {
            self.emit('done', false, message);
        }
    };

    this.run = function () {
        method.call(this, pledge);
    }
}

// Edtend the event emitter
util.inherits(Pledge, EventEmitter);

module.exports.create = function (method) {
    return new Pledge(method);
}