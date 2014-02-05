var Schedule = Class.extend({
    init: function (callback) {
        var self = this;
        self.callback = callback;
        self.scheduled = false;
    },
    abolish: function () {
        this.scheduled = false;
        $(Schedule).trigger('abolish');
    },
    schedule: function (time) {
        var self = this;

        // Check if we already have something scheduled. If
        // we do and we want to execute a request now...we need to
        // abolist the current schedule.
        if (self.scheduled) {
            if (!time) {
                self.abolish();
            } else {
                return true;
            }
        }

        // Get the latest interval or run it now.
        //var time = !now ? self.context.struct.getField('interval').value() : 0;

        // Schedule a new request
        self.scheduled = setTimeout(function() {
            self.abolish();
            self.callback.call(self);
        }, time);

        $(Schedule).trigger('schedule', [time]);
    }
});

var Tab = Class.extend({
    init: function (name) {
        this.name = name;
        this.fields = [];
    },
    get: function (field) {
        for (var key in this.fields) {
            if (toDom(this.fields[key].name) == field) {
                return this.fields[key];
            }
        }

        return false;
    }
});

var Settings = Class.extend({
    init: function (settings) {
        this.tabs = ko.observableArray([]);
        this.tabs.subscribe(function (value) {
            // Loop through all fields in new tab setup
            for (var key in value) {
                for (var index in value[key].fields) {
                    var field = value[key].fields[index];
                    var label = field.name;
                    // Set the value
                    if (typeof settings[label] !== 'undefined') {
                        field.value(settings[label]);
                    }
                }
            }
        });
    },
    all: function () {
        var result = [];
        for (var key in this.tabs()) {
            for (var i = 0; i < this.tabs()[key].fields.length; i++) {
                result.push(this.tabs()[key].fields[i]);
            }
        }
        return result;
    },
    get: function (tab) {
        for (var key in this.tabs()) {
            if (toDom(this.tabs()[key].name) == tab) {
                return this.tabs()[key];
            }
        }
        return false;
    },
    getField: function (field) {
        for (var key in this.tabs()) {
            if (this.tabs()[key].get(field)) {
                return this.tabs()[key].get(field);
            }
        }

        return false;
    }
});

var Widget = SettingAware.extend({
    xhr: false,
    init: function(settings) {
        var self = this;

        // Use the auto increment to keep track of id's
        self.id = ++unique;

        // Keep track of tabbed settings
        self.struct = new Settings(settings);

        // Set up the default settings for all widgets
        var information = new Tab('Widget');

        // Push the title into the information settings
        information.fields.push(new TextField('Title','Widget Title'));
        information.fields.push(new TextField('Interval', 30000));
        self.struct.tabs.push(information);

        // Keep a class name incase we need to add custom styles
        // to the box
        self.classes = ko.observableArray(['box']);
        self.className = ko.computed(function() {
            return self.classes().join(" ");
        });


        // Set up a complex queue request object.
        var request = new Request(function (req) {
            self.load.call(self, function () {
                self.schedule.schedule(self.struct.getField('interval').value());
                request.release();
            });
        });

        // Set up a scheduled task
        self.schedule = new Schedule(function () {
            if (!RequestQueue.has(request)) {
                RequestQueue.push(request);
            }
        });
    },
    remoteRequest: function (host, success) {
        var self = this;

        // Mark the widget as loading
        if (self.classes.indexOf('load') == -1) {
            self.classes.push('load');
        }

        // Kill any existing requests
        if (self.xhr) {
            return true;
        }

        self.xhr = $.post(Remote.forwardUrl, { host: '', path: host }, success)
            .always(function() {
                // Unmark the widget as it's not loading
                if (self.classes.indexOf('load') != -1) {
                    self.classes.splice(self.classes.indexOf('load'), 1);
                }

                self.xhr = false;
            });
    },
    load: function(done) {
        return this;
    },
    content: function() {
        return '';
    },
    render: function() {
        return '<div class="render">' + this.content() + '</div>';
    },
    apply: function() {
        var self = this;

        // Apply render bindings and load
        ko.applyBindings(self, $("#widget-" + self.id + " .render").get(0));
        $("#widget-" + self.id).data(self);

        // Schedule a run for NOW
        this.schedule.schedule(false);

        return true;
    },
    remove: function() {
        Application.removeWidget(this);
    },
    serialize: function () {
        var fields = this.struct.all();
        var temp = {};

        // Build settings;
        for (var key in fields) {
            var field = fields[key];
            temp[field.name] = field.value();
        }

        temp.type = this.constructor.config.type;

        console.log(temp);
        return temp;
    }
});











var Debug = {
    log: function (message) {
        console.log(message);
    }
}