var util = require('util'),
EventEmitter = require('events').EventEmitter;

function Pledge(method)
{
    var self = this;
    self.pledge = {
        success: function (message) {
            self.emit('done', true, message, self);
        },
        fail: function (message) {
            self.emit('done', false, message, self);
        }
    }

    this.run = function () {
        method.call(this, self.pledge);
    }
}

// Edtend the event emitter
util.inherits(Pledge, EventEmitter);

module.exports.create = function (method) {
    return new Pledge(method);
}