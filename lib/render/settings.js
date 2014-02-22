/**
 * SettingAware turns any object into an object capable of having/
 * saving/removing settings.
 */
var SettingAware = Class.extend({
    /**
     * Upon init, we create a settings class
     * that contains all the fields of the object.
     */
    init: function (settings) {
        // Keep track of tabbed settings
        this.struct = new Settings(settings);
    },
    /**
     * When this is called, it will in turn call apply()
     * on the actual field being binded.
     */
    bindField: function (dom, field) {
        field.apply();
    },
    /**
     * This is a redirect call that asks the application to display
     * a settings dialog.
     */
    showSettings: function () {
        Application.showSettings('widget-settings', this);
    },
    /**
     * Save settings takes all the values in our settings struct
     * and saves them in each field.
     */
    saveSettings: function () {
        var fields = this.struct.all();
        for (var key in fields) {
            var field = fields[key];
            field.save();
        }

        this.removeSettings();
    },
    /**
     * This is a redirect call asking the application to
     * remove the settings dialog.
     */
    removeSettings: function () {
        Application.removeSettings();
    },
    /**
     * Define functionality of what needs to happen when the
     * object is to be removed.
     */
    remove: function () {
        // Default functionality, override this
    },
    serialize: function () {
        var self = this;

        var fields = self.struct.all();
        var temp = {};

        // Build settings;
        for (var key in fields) {
            var field = fields[key];
            temp[field.name] = field.value();
        }

        return temp;
    },
});

SettingAware.config = {
    description: '[Please enter the description for this object]'
}


/**
 * Settings represent a group of tabs that
 * contain individual setting fields for a given
 * object.
 */
var Settings = Class.extend({
    /**
     * When a settings object is created. It prepopulates
     * all fields based on the object passed on init.
     */
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
    /**
     * Returns an array of fields that exists in all tabs.
     */
    all: function () {
        var result = [];
        for (var key in this.tabs()) {
            for (var i = 0; i < this.tabs()[key].fields.length; i++) {
                result.push(this.tabs()[key].fields[i]);
            }
        }
        return result;
    },
    /**
     * Get a certain tab object by name.
     */
    get: function (tab) {
        for (var key in this.tabs()) {
            if (toDom(this.tabs()[key].name) == tab) {
                return this.tabs()[key];
            }
        }
        return false;
    },
    /**
     * Get a field by name. This will traverse all tabs
     * to find a match.
     */
    getField: function (field) {
        for (var key in this.tabs()) {
            if (this.tabs()[key].get(field)) {
                return this.tabs()[key].get(field);
            }
        }

        return false;
    }
});

/**
 * Tabs consist of one or more fields that contain
 * references to object settings.
 */
var Tab = Class.extend({
    /**
     * Init a new tab object and give it a unique name.
     */
    init: function (name) {
        this.name = name;
        this.fields = [];
    },
    /**
     * Get a field in the tab by name
     */
    get: function (field) {
        for (var key in this.fields) {
            if (toDom(this.fields[key].name) == field) {
                return this.fields[key];
            }
        }

        return false;
    }
});