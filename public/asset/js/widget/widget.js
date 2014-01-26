var Widget = Class.extend({
    init: function(title, settings) {
        var self = this;
        this.id = ++unique;

        this.settings = $.extend({}, this.defaults);

        // If settings were passes on init
        if (typeof settings !== 'undefined') {
            $.extend(this.settings, settings);
        }

        // Deal with title
        this.settings.title = ko.observable(title);

        this.scheduled = false;

        // Add the title field
        this.fields = {
            all: ko.observableArray([]),
            add: function (field) {
                this.all.push(field);
            }
        };

        this.fields.add(new TextField(
            'Title',
            function() { return self.settings.title(); },
            function(value) { self.settings.title(value); }
        ));

        this.fields.add(new TextField(
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
        return '<div class="render">' + this.content() + '</div>';
    },
    template: function() {
        return '<div id="widget-' + this.id + '" data-bind="template: { name: \'widget-template\','
            + ' data: dashboard.get(' + this.id +'),'
            + ' afterRender: dashboard.get(' + this.id +').apply }'
            + '"></div>';
    },
    postApply: function() {
        return false;
    },
    apply: function(insertedDomElementArray, dataItem) {
        var node = $('.gridster #widget-' + dataItem.id + ' .box .render');
        ko.applyBindings(dataItem, node.get(0));

        dataItem.postApply();
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