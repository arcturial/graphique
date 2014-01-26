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

    this.pledge = function (method) {
        var item = pledge.create(method);

        item.on('done', function (result, message) {
            self.pledges.pop();
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

                process.nextTick(function() {
                    self.pledges[key].run();
                });
            }
        }
    }
}


module.exports.create = function () {
    return new Promise();
}