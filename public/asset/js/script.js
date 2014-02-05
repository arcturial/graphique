var unique = 0;

var SettingAware = Class.extend({
    init: function () {},
    bindField: function (dom, field) {
        field.apply();
    },
    showSettings: function () {
        Application.showSettings('widget-settings', this);
    },
    saveSettings: function () {
        var fields = this.struct.all();
        for (var key in fields) {
            var field = fields[key];
            field.save();
        }
        this.removeSettings();
        // Force a refresh
        this.schedule.active = true;
        this.schedule.schedule(true);
    },
    removeSettings: function () {
        Application.removeSettings();
    },
    remove: function () {
        // Default functionality, override this
    }
});

SettingAware.config = {
    description: '[Please enter the description for this object]'
}

function toDom(string)
{
    return string.replace(/\s/g, "-").toLowerCase();
}

var Field = Class.extend({
    init: function(name, defaultValue) {
        var self = this;
        self.name = name;
        self.value = ko.observable(defaultValue);
        self.data = ko.observable(self.value());

        // Keep the buffer in sync
        self.value.subscribe(function (value) {
            self.data(value);
        });
    },
    render: function() {
        return '';
    },
    save: function() {
        this.value(this.data());
    },
    apply: function() {
        ko.applyBindings(this, $("#" + toDom(this.name)).get(0));

        // Call render callback
        if (typeof this.callback !== 'undefined') {
            this.callback.call(this);
        }
    },
    onInit: function (callback) {
        this.callback = callback;
    }
});

var TextField = Field.extend({
    render: function() {
        render = "<input"
            + " type='text'"
            + " class='form-control'"
            + " name='" + this.name + "'"
            + " id='" + toDom(this.name) + "'"
            + " data-bind='value: data'"
            + " />";

        return render;
    }
});

var RadioBox = Field.extend({
    init: function(name, defaultValue, options) {
        this._super(name, defaultValue);
        this.options = ko.observableArray(options);
    },
    render: function() {
        render = "<div id='" + toDom(this.name) + "'>"
            + "<div data-bind='foreach: options'>"
            + "<div class='radio'>"
            + "<label>"
            + "<input type='radio' name='" + this.name + "'"
            + " data-bind='checked: $parent.data, value: value'"
            + " /><span data-bind='text: name'></span>"
            + "</label>"
            + "</div>"
            + "</div>"
            + '<p class="text-danger" data-bind="visible: options().length == 0">'
            + 'No options available.'
            + '</p>'
            + "</div>";

        return render;
    }
});

var TextArea = Field.extend({
    render: function() {
        this._super();

        render = "<textarea"
            + " class='form-control'"
            + " rows='4'"
            + " name='" + this.name + "'"
            + " id='" + toDom(this.name) + "'"
            + " data-bind='text: data, value: data'"
            + " ></textarea>";

        return render;
    }
});


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
        var dash = new Dashboard('New Dashboard');
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
                var dash = new Dashboard(dash.name);
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

var Dashboard = SettingAware.extend({
    init: function(name) {
        this._super();

        var self = this;
        self.name = ko.observable(name);
        self.widgets = ko.observableArray([]);

        // Add the 'name' field
        /*
        self.fields.add(
            new TextField(
                'Title',
                function () { return self.name(); },
                function (value) { self.name(value); }
            )
        );
*/
    },
    abolish: function () {
        for (var key in this.widgets()) {
            this.widgets()[key].schedule.abolish();
        }
    },
    get: function (id) {
        var widgets = this.widgets();
        for (var key in widgets) {
            if (widgets[key].id == id) {
                return widgets[key];
            }
        }
        return false;
    },
    addWidgetSettings: function () {
        Application.showSettings('widget-add', Application);
    },
    addWidget: function (type) {
        // Remove any settings
        Application.removeSettings();

        // Create empty widget
        var widget = Application.createWidget(type, {});

        // Add the widget
        this.widgets.push(widget);

        // Show new settings
        widget.showSettings();

        return widget;
    },
    serialize: function () {
        var self = this;
        var widgets = [];
        for (var key in self.widgets()) {
            widgets.push(self.widgets()[key].serialize());
        }
        return { name: self.name(), widgets: widgets };
    },
    remove: function () {
        Application.removeDashboard(this);
        Application.removeSettings();
    }
});

Dashboard.config = {
    description: "Dashboards contain a collection of widgets."
};

/**
 * Prepare the application.
 */
$(document).ready(function() {

    // Grid settings
    var grid = {
        base: ($('.gridly').width() - (20 * 12)) / 12,
        base_h: 170,
        gutter: 20,
        columns: 12
    };

    ko.bindingHandlers.updateGrid = {
        update: function(element, valueAccessor) {
            // Unwrap the dependency on the widget elements
            var data = ko.utils.unwrapObservable(valueAccessor());

            // Deal with sizing
            $('.gridly > div').each(function() {

                // Throw the widget off screen and force the animation
                $(this).css("left", "-" + ($(this).width() - 50) + "px");
                $(this).css("top", ((Math.random() * 500) + 100) + "px");

                var col = $(this).attr("data-col");
                var row = $(this).attr("data-row");

                // Calculate width correctly
                $(this).attr(
                    "data-width",
                    ((col * (grid.base + grid.gutter)) - grid.gutter)
                );

                $(this).attr("data-height", (row * grid.base_h) + ((row - 1) * grid.gutter));

                $(this).width($(this).attr("data-width"));
                $(this).height($(this).attr("data-height"));

                // Notify the widget resize
                var id = $(this).data().id;
                $(Application.active().get(id)).trigger('size');
            });

            // Refresh a grid
            $('.gridly').gridly(grid);
        }
    };

    // Deactive all widgets that will be replaced
    Application.active.subscribe(function (value) {
        if (value) {
            for (var key in value.widgets()) {
                value.widgets()[key].schedule.active = false;
            }

            // Persist the new widget order
            Application.reorder();
        }
    }, null, 'beforeChange');

    // Activate widgets
    Application.active.subscribe(function (value) {
        for (var key in value.widgets()) {
            value.widgets()[key].schedule.active = true;
        }
    });

    // Check for dashboard rotation
    var rotating = false;
    Application.rotating.subscribe(function (value) {
        if (!value) {
            clearInterval(rotating);
            rotating = false;
            return true;
        }

        rotating = setInterval(function () {
            Application.nextDashboard();
        }, 30000);
    });

    // Apply KO bindings
    ko.applyBindings(Application);

    // Set up a socket to load from the data store
    var socket = io.connect('http://' + window.location.host);
    Application.bind(socket);
});