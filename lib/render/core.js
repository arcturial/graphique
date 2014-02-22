/**
 * ID to keep track of auto increment values.
 */
var unique = 0;

/**
 * This is a helper method to turn a string into a "dom"
 * id reference.
 */
function toDom(string) {
    return string.replace(/\s/g, "-").toLowerCase();
}

/**
 * Array helper for shuffling values.
 */
function shuffle(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

/**
 * This is a wrapper for the active socket connection.
 */
var Socket = {
    io: ko.observable(false),
    emit: function (method, callback) {
        this.io().emit(method, callback);
    },
    on: function (method, callback) {
        this.io().on(method, callback);
    },
    removeListener: function (listener) {
        this.io().removeListener(listener);
    }
}

/**
 * This is the core dashboard class. It is the
 * container of the currently requested and active
 * dashboard and it's panels.
 */
var Core = SettingAware.extend({
    active: ko.observable(false),
    panels: ko.observableArray([]),
    init: function(settings) {
        var self = this;
        self._super(settings);

        // Set up the settings for the dashboard
        var settings = new Tab('Settings');

        // Add fields to the tab
        settings.fields.push(new HiddenField('ID'));
        settings.fields.push(new TextField('Rotate Interval', 30000));
        self.struct.tabs.push(settings);
    },
    addPanel: function (panel) {
        var self = this;
        self.panels.push(panel);
    },
    newPanel: function () {
        var self = this;
        var panel = new Panel({});
        self.panels.push(panel);

        Application.showSettings('widget-settings', panel);
    },
    setActivePanel: function (id) {
        this.releaseAll();

        var self = this;
        if (self.active() != self.panels()[id]) {
            self.active(self.panels()[id]);
        }
    },
    nextPanel: function () {
        // Find next index
        var active = this.panels().indexOf(this.active());
        if (active >= (this.panels().length -1)) {
            active = 0;
        } else {
            active++;
        }

        this.setActivePanel(active);
    },
    releaseAll: function () {
        var self = this;

        // Terminate all ajax requests
        Remote.abolish();

        // Terminate entire request queue
        RequestQueue.abolish();

        // Disable all widgets
        for (var key in self.panels()) {
            self.panels()[key].abolish();
        }
    },
    remove: function() {
        alert('unsupported atm');
    },
    /**
     * Save causes the current dashboard state to persist to
     * external store via web sockets.
     */
    save: function () {
        var self = this;
        var save = self.serialize();

        // Show busy message until save is done
        Application.socket.emit('persist', save);
        Application.showSettings('widget-busy', {});

        Application.socket.on('saved', function () {
            Application.socket.removeListener(this);
            setTimeout(function() {
                Application.removeSettings();
            }, 1000);
        });
    },
    /**
     * Serialize the application widgets.
     */
    serialize: function () {
        var self = this;
        var fields = self._super();
        self.reorder(); // Make sure the active board order is persisted

        var panels = [];
        for (var key in self.panels()) {
            var panel = self.panels()[key];
            panels.push(panel.serialize());
        }

        // Extend the settings
        fields.panels = panels;

        return fields;
    },
    bind: function () {
        var self = this;

        // Subscribes this dashboards to updates from the backend
        Application.socket.emit('subscribe', self.struct.getField('id').value());

        // Check if dashboard was not found
        Application.socket.on('notFound', function (data) {
            Application.newDash(true);
        });

        // Subscribe to backend sync events
        Application.socket.on('sync', function (data) {
            if (data.dashboard != self.struct.getField('id').value()) {
                console.log('no match ' + data.dashboard);
                return false;
            }

            self.releaseAll();

            // Delete all existing panels
            self.panels.removeAll();

            // Acquire new panels
            data = data.data.panels;

            // Add all panels
            for (var key in data) {
                var dash = data[key];
                var widgets = dash.widgets;
                var panel = new Panel(dash);
                for (var index in widgets) {
                    var widget = widgets[index];
                    widget = Application.createWidget(widget.type, widget);
                    if (typeof widget !== 'undefined') {
                        panel.widgets.push(widget);
                    }
                }

                // Add a panel
                self.addPanel(panel);
            }


            // If we have 0 panels, we create a default one.
            if (data.length == 0) {
                self.panels.push(new Panel({}));
            }

            // Set the first panel as the default active panel
            self.setActivePanel(0);
        });
    },
    reorder: function () {
        if (this.active()) {
            this.active().widgets.sort(function(a, b) {
                a = $("#widget-" + a.id).closest('.brick');
                b = $("#widget-" + b.id).closest('.brick');
                var a_index = a.position().left + (a.position().top * $('.gridly').width());
                var b_index = b.position().left + (b.position().top * $('.gridly').width());

                return a_index - b_index;
            });
        }
    },
    /**
     * Remove an existing widget.
     */
    removeWidget: function (item) {
        var self = this;
        for (var key in self.active().widgets()) {
            var widget = self.active().widgets()[key];
            if (widget.id == item.id) {
                item.removeSettings();
                var remove = self.active().widgets.splice(key, 1);
            }
        }
    },
    applyWidget: function (dom, item) {
        item.apply();
    }
});

Core.config = {
    description: "The dashboard is a collection of panels which contains widgets."
}





/**
 * The container is the application object. It contains
 * all application variables.
 */
var Application = {
    dashboard: new Core({ ID: window.location.pathname }),
    type: [],
    rotating: ko.observable(false),
    animating: ko.observable(true),
    newDash: ko.observable(false),
    socket: Socket,
    registerWidgetType: function (widget) {
        var self = this;
        self.type.push({
            'config': widget.config,
            'obj': widget
        });
    },
    /**
     * Keep track of custom style requests for widgets.
     */
    styles: {
        all: '',
        add: function (style) {
            this.all += style;
        }
    },
    /**
     * Create a new widget based on the type/title/settings
     * of the new instance.
     */
    createWidget: function (type, settings) {
        var self = this;
        for (var key in self.type) {
            var widget = self.type[key];

            if (widget.config.type == type) {
                return new widget.obj(settings);
            }
        }
    },
    /**
     * Helper method to draw a settings box template.
     */
    showSettings: function (template, data) {
        var self = this;
        var body = '<div class="settings box" data-bind="template: { name: \'' + template + '\' }"></div>';
        $("body").append('<div class="block"></div>');
        $("body").append(body);

        var elem = $('.settings').get(0);
        ko.cleanNode(elem);
        ko.applyBindings(data, elem);
    },
    /**
     * Remove an existing settings box.
     */
    removeSettings: function () {
        var self = this;
        $(".block").remove();
        $(".settings").remove();
    },
    toggleRotate: function () {
        if (this.rotating()) {
            this.rotating(false);
        } else {
            this.rotating(true);
        }
    },
    toggleAnimation: function ()
    {
        if (this.animating()) {
            this.animating(false);
        } else {
            this.animating(true);
        }
    }
}


// Deactive all widgets that will be replaced
Application.dashboard.active.subscribe(function (value) {
    if (value) {
        for (var key in value.widgets()) {
            value.widgets()[key].schedule.active = false;
        }

        // Persist the new widget order
        Application.dashboard.reorder();
    }
}, null, 'beforeChange');

// Activate widgets when the dashboard is changed.
Application.dashboard.active.subscribe(function (value) {
    for (var key in value.widgets()) {
        value.widgets()[key].schedule.active = true;
    }
});


// Check for dashboard rotation
var rotating = false;

// Abstract the rotation logic
var rotatingFunc = function (value, interval) {
    clearInterval(rotating);

    if (!value) {
        $(".graphique-time").hide();
        rotating = false;
        return true;
    }

    var count = 0;

    rotating = setInterval(function () {
        count++;
        $(".graphique-time").html("rotating in: " + ((interval - (count * 1000)) / 1000) + " seconds").show();

        // Rotate and refresh if interval matches
        if (count * 1000 >= interval) {
            Application.dashboard.nextPanel();
            rotatingFunc(true, Application.dashboard.struct.getField('rotate-interval').value());
        }
    }, 1000);
};

// Register a subscriber to turn on/off panels rotation
Application.rotating.subscribe(function (value) {
    rotatingFunc(value, Application.dashboard.struct.getField('rotate-interval').value());
});