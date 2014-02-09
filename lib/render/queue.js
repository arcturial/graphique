/**
 * The Remote object defines a way of running AJAX requests
 * in a controlled fashion.
 */
var Remote = {
    forwardUrl: "http://" + window.location.host + "/forward",
    active: [],
    /**
     * Run a remote request. This is a helper function that makes doing
     * remote requests really easy by forwarding all requests through the
     * node backend. Thus solving cross-site ajax requests.
     */
    request: function (host, success, always) {
        var self = this;

        var ajax = $.post(Remote.forwardUrl, { host: '', path: host }, success)
            .always(function () {
                for (var key in self.active) {
                    if (self.active[key] == ajax) {
                        self.active.splice(key, 1);
                        Debug.decrement('xhr');
                    }
                }

                // Forward the call to the handler
                if (typeof always !== 'undefined') {
                    always.call(self);
                }
            });

        self.active.push(ajax);
        Debug.increment('xhr');
    },
    /**
     * Terminate all active XHR requests.
     */
    abolish: function () {
        for (var key in this.active) {
            this.active[key].abort();
        }
    }
};

/**
 * The Request object is part of the management queue
 * and represents a single instance of a queue request
 * to be processed by a worker.
 */
function Request(callback, context, priority) {
    var self = this;
    self.done = false;
    self.priority = priority;

    /**
     * Run a request object and call the done callback
     * when the request completes.
     */
    self.run = function (done) {
        self.done = done;
        callback.call(context, self);
    }

    /**
     * Release is called in the request callback. This tells
     * the request object that it's now done processing.
     */
    self.release = function () {
        if (typeof self.done !== 'undefined') {
            self.done.call(self);
        }

        return self;
    }
}

Request.PRIORITY_LOW = 0;
Request.PRIORITY_HIGH = 10;

/**
 * Workers are objects capable of processing a request.
 */
function Worker() {
    var self = this;
    var onReady = null;
    self.busy = false;

    /**
     * Set a ready callback on the worker. This will be fired
     * when the worker is done processing a request.
     */
    self.ready = function (callback) {
        onReady = callback;
        return self;
    }

    /**
     * Process a request.
     */
    self.process = function (request) {
        self.busy = true;

        var markAsDone = function () {
            self.busy = false;

            if (onReady != null) {
                onReady();
            }
        };

        request.run(markAsDone);
    }
}

/**
 * The Queue consists of workers that are used
 * to process individual requests.
 */
function Queue(workers) {
    var self = this;
    var requests = [];

    // Configure the workers. Builds an array of
    // available workers.
    self.workers = [];
    for (var i = 0; i < workers; i++) {
        var worker = new Worker();
        worker.ready(function () { self.tick(); });
        self.workers.push(worker);
    }

    /**
     * Push a request into the queue. As soon as an
     * available worker is ready it will be processed.
     */
    self.push = function (request) {
        requests.push(request);
        requests.sort(function (a, b) {
            return b.priority - a.priority;
        });

        Debug.increment('queue-request');
        this.tick();
    }

    /**
     * Removes all requests from the queue.
     */
    self.abolish = function () {
        for (var key in requests) {
            Debug.decrement('queue-request');
        }

        requests = [];
    }

    /**
     * Returns the amount of requests currently
     * queued.
     */
    self.count = function () {
        return requests.length;
    }

    /**
     * Test to see if the queue contains a reference
     * to a request.
     */
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
                var job = requests.shift();
                Debug.decrement('queue-request');
                self.workers[key].process(job);
                return true;
            }
        }
    }
}


// Create a default request queue of 2 workers
var RequestQueue = new Queue(2);