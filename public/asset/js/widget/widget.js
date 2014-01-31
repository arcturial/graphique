var Widget = Class.extend({
    init: function(title, settings) {
        var self = this;

        // Use the auto increment to keep track of id's
        self.id = ++unique;

        // Keep a class name incase we need to add custom styles
        // to the box
        self.className = ko.observable('box');

        // Create settings from the defaults at first
        self.settings = $.extend({}, self.defaults);

        // If settings were passes on init
        if (typeof settings !== 'undefined') {
            $.extend(self.settings, settings);
        }

        // Deal with title
        self.settings.title = ko.observable(title);

        self.scheduled = false;

        // Add the title field
        self.fields = {
            all: ko.observableArray([]),
            add: function (field) {
                this.all.push(field);
            }
        };

        self.fields.add(new TextField(
            'Title',
            function() { return self.settings.title(); },
            function(value) { self.settings.title(value); }
        ));

        self.fields.add(new TextField(
            'Interval',
            function() { return self.settings.interval; },
            function(value) { self.settings.interval = value; }
        ));
    },
    schedule: function() {

        var self = this;

        if (typeof self.settings.interval !== 'undefined')
        {
            self.scheduled = setTimeout(function() {
                self.load();
            }, this.settings.interval);
        }
    },
    defaults: {
        'interval': 30000
    },
    load: function() {
        if (self.scheduled) {
            clearInterval(self.scheduled);
        }

        return this;
    },
    content: function() {
        return '';
    },
    render: function() {
        return '<div id="widget-' + this.id + '"'
            + '  data-bind="with: dashboard.get(' + this.id + ')">'
            + '  <div data-bind="attr: { class: className }">'
            + '    <div class="header">'
            + '      <h2 data-bind="text: settings.title"></h2>'
            + '      <a data-bind="click: showSettings" class="glyphicon glyphicon-cog"></a>'
            + '    </div>'
            + '    <div class="render">' + this.content() + '</div>'
            + '  </div>'
            + '</div>';
    },
    apply: function() {
        return true;
    },
    showSettings: function() {
        Application.showSettings('widget-settings', this);
    },
    saveSettings: function() {

        var fields = this.fields.all();

        for (var key in fields) {
            var field = fields[key];
            field.save();
        }

        this.removeSettings();
        this.load();
    },
    removeSettings: function() {
        Application.removeSettings();
    },
    removeWidget: function() {
        app.removeWidget(this);
    },
    bindField: function(dom, item) {
        ko.applyBindings(item, $('#settings #' + toDom(item.name)).get(0));
    },
    serialize: function () {

        var node = $("#widget-" + this.id);
        var data = node.data();

        var temp = $.extend({}, this.settings);
        temp.title = this.settings.title();
        temp.col = data.col;
        temp.row = data.row;
        temp.type = this.constructor.config.type;

        return temp;
    }
});