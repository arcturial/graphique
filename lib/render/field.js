
var Field = Class.extend({
    init: function(name, defaultValue, persist) {
        var self = this;
        self.name = name;
        self.value = ko.observable(defaultValue);
        self.data = ko.observable(self.value());
        self.persist = function () {
            self.value(self.data());
        }

        // If a custom save function was specified
        // use that instead.
        if (typeof persist !== 'undefined') {
            self.persist = persist;
        }

        // Keep the buffer in sync
        self.value.subscribe(function (value) {
            self.data(value);
        });
    },
    renderFull: function () {
        var string = '<div class="form-group" id="' + toDom(this.name) + '">';
        string += '<label data-bind="attr: { for: name }, text: name"></label>';
        string += '<div>' + this.render() + '</div>';
        string += '</div>';
        return string;
    },
    render: function() {
        return '';
    },
    save: function() {
        this.persist.call(this);
    },
    apply: function() {
        if ($("#" + toDom(this.name)).length > 0)
        {
            ko.applyBindings(this, $("#" + toDom(this.name)).get(0));

            // Call render callback
            if (typeof this.callback !== 'undefined') {
                this.callback.call(this);
            }
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
            + " data-bind='value: data'"
            + " />";

        return render;
    }
});

var ToggleField = Field.extend({
    init: function(name, className, persist) {
        var self = this;
        self._super(name, 0, persist);
        self.className = className;
    },
    toggle: function () {
        if (this.data()) {
            this.data(0);
        } else {
            this.data(1);
        }
    },
    render: function() {
        var render = "<a data-bind='click: toggle, css: { \"active\": data }' class='toggle "
            + this.className + "' title='" + this.name + "'></a>";
        return render;
    }
});

var HiddenField = Field.extend({
    init: function(name) {
        this._super(name, '');
    },
    renderFull: function () {

    },
    render: function() {
        var string = '<div class="form-group hidden" id="' + toDom(this.name) + '">';
        string += '<div>' + this.render() + '</div>';
        string += '</div>';
        return string;
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


