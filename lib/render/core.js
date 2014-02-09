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

function shuffle(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

/**
 * The container is the application object. It contains
 * all application variables.
 */
var Application = {
    dashboards: ko.observableArray([]),
    active: ko.observable(false),
    type: [],
    io: null,
    rotating: ko.observable(false),
    animating: ko.observable(true),
    addDashboard: function (dashboard) {
        var self = this;
        self.dashboards.push(dashboard);
    },
    newDashboard: function () {
        var dash = new Dashboard({});
        this.dashboards.push(dash);

        Application.showSettings('widget-settings', dash);
    },
    setActiveDashboard: function (id) {
        var self = this;
        if (self.active() != self.dashboards()[id]) {
            self.active(self.dashboards()[id]);
        }
    },
    nextDashboard: function () {
        var active = this.dashboards().indexOf(this.active());
        if (active >= (this.dashboards().length -1)) {
            active = 0;
        } else {
            active++;
        }
        this.setActiveDashboard(active);
    },
    registerWidgetType: function (widget) {
        var self = this;
        self.type.push({
            'config': widget.config,
            'obj': widget
        });
    },
    bind: function (io) {
        var self = this;
        self.io = io;
        self.io.on('sync', function (data) {

            // Terminate all ajax requests
            Remote.abolish();

            // Terminate entire request queue
            RequestQueue.abolish();

            // Disable all widgets
            for (var key in self.dashboards()) {
                self.dashboards()[key].abolish();
            }

            // Delete all existing dashboards
            self.dashboards.removeAll();

            data = JSON.parse(data);

            // Add all dashboards
            for (var key in data) {
                var dash = data[key];
                var widgets = dash.widgets;
                var dash = new Dashboard(dash);
                for (var index in widgets) {
                    var widget = widgets[index];
                    widget = self.createWidget(widget.type, widget);
                    if (typeof widget !== 'undefined') {
                        dash.widgets.push(widget);
                    }
                }
                self.addDashboard(dash);
            }

            self.setActiveDashboard(0);
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
     * Serialize the application widgets.
     */
    serialize: function () {
        var self = this;
        Application.reorder(); // Make sure the active board is persisted

        var dashboards = [];
        for (var key in self.dashboards()) {
            var dash = self.dashboards()[key];
            dashboards.push(dash.serialize());
        }
        return dashboards;
    },
    /**
     * Save causes the current dashboard state to persist to
     * external store via web sockets.
     */
    save: function () {
        var self = this;
        var save = self.serialize();

        // Show busy message until save is done
        self.io.emit('persist', save);
        this.showSettings('widget-busy', {});
        self.io.on('saved', function () {
            self.io.removeListener(this);
            setTimeout(function() {
                self.removeSettings();
            }, 1000);
        });
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
    removeDashboard: function (dashboard) {

        var index = this.dashboards().indexOf(dashboard);

        if (index > -1) {
            this.dashboards.splice(index, 1);

            // Move to next dash
            if (this.active() == dashboard) {
                this.nextDashboard();
            }
        }
    },
    applyWidget: function (dom, item) {
        item.apply();
    },
    reorder: function () {
        this.active().widgets.sort(function(a, b) {
            a = $("#widget-" + a.id).closest('.brick');
            b = $("#widget-" + b.id).closest('.brick');
            var a_index = a.position().left + (a.position().top * $('.gridly').width());
            var b_index = b.position().left + (b.position().top * $('.gridly').width());

            return a_index - b_index;
        });
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





var Debug = {
    log: function (message) {
        console.log(message);
    }
}