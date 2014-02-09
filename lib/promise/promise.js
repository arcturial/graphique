var pledge = require('./pledge');

function Promise()
{
    var self = this;
    var done = false;
    var finalResult = true;

    // Variables
    self.pledges = [];

    var testPledge = function (result, message) {

        finalResult &= result;

        if (finalResult && self.pledges.length == 0) {
            done('', finalResult);
        }

        if (!finalResult) {
            done(message, finalResult);
        }
    }

    this.pledge = function (method, input) {

        var func = (function() {
            return function (pledge) {
                var arg = [pledge];
                return method.apply(this, arg.concat(input));
            }
        })(input);

        var item = pledge.create(func);

        item.on('done', function (result, message, pledge) {

            for (var key in self.pledges) {
                if (self.pledges[key] == pledge) {
                    self.pledges.splice(key, 1);
                }
            }

            testPledge(result, message);
        });

        self.pledges.push(item);
        return self;
    }

    this.then = function (callback) {

        if (!done)
        {
            // Save the callback
            done = callback;

            // Run the pledges asynchronously
            for (var key in self.pledges) {
                var tick = (function (current) {
                    return function () {
                        current.run();
                    }
                })(self.pledges[key]);

                process.nextTick(tick);
            }
        }
    }
}


module.exports.create = function () {
    return new Promise();
}