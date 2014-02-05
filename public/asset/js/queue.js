var Remote = {
    forwardUrl: "http://" + window.location.host + "/forward",
    active: [],
    request: function (host, success, always) {
        var self = this;

        var ajax = $.post(Remote.forwardUrl, { host: '', path: host }, success)
            .always(function () {
                for (var key in self.active) {
                    if (self.active[key] == ajax) {
                        self.active.slice(key, 1);
                    }
                }

                // Forward the call to the handler
                if (typeof always !== 'undefined') {
                    always.call(self);
                }
            });

        self.active.push(ajax);
    },
    abolish: function () {
        for (var key in this.active) {
            this.active[key].abort();
        }
    }
};


function Request(callback, context) {
    var self = this;

    self.run = function () {
        callback.call(context, self);
    }

    self.release = function () {
        $(self).trigger('release');
        return self;
    }

    self.ready = function (callback) {
        $(self).on('release', callback);
        return self;
    }
}

function Worker() {
    var self = this;
    self.busy = false;

    self.release = function () {
        $(self).trigger('release');
        return self;
    }

    self.ready = function (callback) {
        $(self).on('release', callback);
        return self;
    }

    self.process = function (request) {
        self.busy = true;

        request.ready(function () {
            self.busy = false;
            self.release();
        }).run();
    }
}

function Queue(workers) {
    var self = this;
    var requests = [];

    // Configure the workers
    self.workers = [];
    for (var i = 0; i < workers; i++) {
        var worker = new Worker();
        worker.ready(function () { self.tick(); });
        self.workers.push(worker);
    }

    self.push = function (request) {
        requests.push(request);
        this.tick();
    }

    self.abolish = function () {
        requests = [];
    }

    self.count = function () {
        return requests.length;
    }

    self.has = function (request) {
        for (var key in requests) {
            if (requests[key] == request) {
                return true;
            }
        }

        return false;
    }

    /**
     * Tick attempts to process the next item in the queue.
     */
    self.tick = function () {
        if (requests.length == 0) {
            return true;
        }

        for (var key in self.workers) {
            // Check if the worker is busy.
            // If not, have it process the job
            if (!self.workers[key].busy) {
                self.workers[key].process(requests.shift());
                return true;
            }
        }
    }
}

var RequestQueue = new Queue(1);