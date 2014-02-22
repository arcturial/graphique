var Panel = SettingAware.extend({
    init: function(settings) {
        this._super(settings);

        var self = this;
        self.widgets = ko.observableArray([]);

        // Add the 'name' field
        var dashboard = new Tab('Panel');

        // Push the title into the information settings
        dashboard.fields.push(new TextField('Title','Panel Title'));
        self.struct.tabs.push(dashboard);
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

        var fields = self.struct.all();
        var temp = { widgets: widgets };

        for (var key in fields) {
            var field = fields[key];
            temp[field.name] = field.value();
        }

        return temp;
    },
    remove: function () {
        Application.removeDashboard(this);
        Application.removeSettings();
    }
});

Panel.config = {
    description: "Dashboards contain a collection of widgets."
};


