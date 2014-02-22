var Schedule = Class.extend({
    init: function (callback) {
        var self = this;
        self.callback = callback;
        self.scheduled = false;
    },
    abolish: function () {
        if (this.scheduled) {
            Debug.decrement('schedule');
        }

        clearTimeout(this.scheduled);
        this.scheduled = false;
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
        var func = function() {
            self.abolish();
            self.callback.call(self);
        };

        // Schedule a new request
        self.scheduled = setTimeout(func, time);
        Debug.increment('schedule');
    }
});

var Widget = SettingAware.extend({
    init: function(settings) {
        var self = this;
        self._super(settings);

        // Use the auto increment to keep track of id's
        self.id = ++unique;

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
        self.request = new Request(function (req) {

            // Mark the widget as loading
            if (self.classes().indexOf('load') == -1) {
                self.classes.push('load');
            }

            self.load.call(self, function () {
                self.schedule.schedule(self.struct.getField('interval').value());
                req.release();

                // Unmark the widget as it's not loading
                if (self.classes().indexOf('load') != -1) {
                    self.classes.splice(self.classes().indexOf('load'), 1);
                }

                if (self.classes().indexOf('queue') != -1) {
                    self.classes.splice(self.classes().indexOf('queue'), 1);
                }
            });
        }, this, Request.PRIORITY_LOW);

        // Set up a scheduled task
        self.schedule = new Schedule(function () {
            if (!RequestQueue.has(self.request)) {
                self.classes.push('queue');
                RequestQueue.push(self.request);
            }
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
        Application.dashboard.removeWidget(this);
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

        return temp;
    },
    error: function (message) {

        var error = document.createElement('div');
        error.className = 'graphique-error';
        error.innerHTML = 'widget-' + this.id + ': ' +message;
        error.style.display = 'none';

        $('.graphique-log').append($(error));

        $(error)
            .show()
            .delay(5000)
            .fadeOut(500, function () {
                $(this).remove();
            });
    },
    saveSettings: function () {
        this._super();

        // Force a refresh
        this.schedule.schedule(false);
    }
});


var Debug = {
    labels: {},
    increment: function (label) {
        if (typeof this.labels[label] === 'undefined') {
            this.labels[label] = 0;
        }

        this.labels[label]++;
    },
    decrement: function (label) {
        if (typeof this.labels[label] === 'undefined') {
            this.labels[label] = 0;
        }

        this.labels[label]--;
    },
    reset: function () {
        this.labels = {};
    }
}