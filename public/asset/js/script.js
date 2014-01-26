var unique = 0;

function toDom(string)
{
    return string.replace(" ", "-");
}

var Field = Class.extend({
    init: function(name, value, callback) {
        this.name = name;
        this.value = value;
        this.callback = callback;
    },
    render: function() {
        this.data = ko.observable(this.value());
        return '';
    },
    save: function() {
        this.callback(this.data());
    }
});

var TextField = Field.extend({
    render: function() {
        this._super();

        render = "<input"
            + " type='text'"
            + " class='form-control'"
            + " id='" + toDom(this.name) + "'"
            + " name='" + this.name + "'"
            + " data-bind='value: data'"
            + " />";

        return render;
    },
    apply: function() {
        ko.applyBindings(this, $("#" + this.name).get(0));
    }
});


/**
 * The container is the application object. It contains
 * all application variables.
 */
function Application() {
    var self = this;
    self.type = [];

    /**
     * Create a new dashboard struct that keeps track of dashboard
     * and widget information.
     */
    self.dashboard = {
        name: ko.observable('Graphique'),
        widgets: ko.observableArray(),
        get: function (id) {
            var widgets = self.dashboard.widgets();

            for (var key in widgets) {
                if (widgets[key].id == id) {
                    return widgets[key];
                }
            }

            return false;
        }
    }

    /**
     * Register a widget object as a supported
     * widget type.
     */
    self.register = function (widget) {
        self.type.push({
            'config': widget.config,
            'obj': widget,
            addWidget: function() {

                var widget = self.createWidget(
                    this.config.type,
                    'New Widget',
                    {}
                );

                self.dashboard.widgets.push(widget);

                // Kill the add box
                Application.removeSettings();

                widget.showSettings();
            }
        });
    }

    /**
     * Bind the application to a web socket so that
     * it can synchronize with the store.
     */
    self.bind = function (io) {
        self.io = io;

        self.io.on('sync', function (data) {

            data = JSON.parse(data);

            for (var key in data) {
                var widget = data[key];
                widget = self.createWidget(widget.type, widget.title, widget);

                if (typeof widget !== 'undefined') {
                    self.dashboard.widgets.push(widget);
                    widget.load();
                }
            }
        });
    }

    /**
     * Keep track of custom style requests for widgets.
     */
    self.styles = {
        all: '',
        add: function (style) {
            this.all += style;
        }
    }

    /**
     * Create a new widget based on the type/title/settings
     * of the new instance.
     */
    self.createWidget = function (type, title, settings) {
        for (var key in self.type) {
            var widget = self.type[key];

            if (widget.config.type == type) {
                return new widget.obj(title, settings);
            }
        }
    }

    /**
     * Serialize the application widgets.
     */
    self.serialize = function () {

        var widgets = [];

        for (var key in self.dashboard.widgets()) {
            var widget = self.dashboard.widgets()[key];
            widgets.push(widget.serialize());
        }

        return widgets;
    }

    /**
     * Save causes the current dashboard state to persist to
     * external store via web sockets.
     */
    self.save = function () {
        var widgets = self.serialize();
        self.io.emit('persist', widgets);
    }

    /**
     * Add a new widget to the current dashboard.
     */
    self.addWidget = function () {
        Application.showSettings('widget-add', this);
    }
}

/**
 * Helper method to draw a settings box template.
 */
Application.showSettings = function (template, data) {

    var body = '<div class="settings box" data-bind="template: { name: \'' + template + '\' }"></div>';

    $("body").append('<div class="block"></div>');
    $("body").append(body);

    ko.applyBindings(data, $('.settings').get(0));
}

/**
 * Remove an existing settings box.
 */
Application.removeSettings = function () {
    $(".block").remove();
    $(".settings").remove();
}

/**
 * Create a new application available globally.
 */
var app = new Application();



/**
 * Prepare the application.
 */
$(document).ready(function() {

    // Gridster setup (dynamic width)
    var width = $(".gridster").width() / 12;
    var grid = $(".gridster").gridster({
        widget_margins: [10, 10],
        widget_base_dimensions: [width - 20, 160],
        widget_selector: "div",
        max_cols: 12
    }).data('gridster');

    // Add a subscriber to add widgets to the gridster
    // grid. This is an important hook as it's responsible
    // for the display of widgets.
    app.dashboard.widgets.subscribe(function (value) {

        for (var key in value) {
            var item = value[key];

            if ($('#widget-' + item.id).length == 0) {
                grid.add_widget(item.template(), item.constructor.config.width, item.constructor.config.height);
                ko.applyBindings(app, $("#widget-" + item.id).get(0));
            }
        }
    });

    // Apply KO bindings
    ko.applyBindings(app);

    // Set up a socket to load from the data store
    var socket = io.connect('http://' + window.location.host);
    app.bind(socket);
});