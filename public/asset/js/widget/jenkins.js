var Jenkins = Widget.extend({
    init: function (title, settings) {

        var self = this;

        this._super(title, settings);

        this.data = [];
        this.data.status = ko.observable('grey');
        this.data.title = ko.observable('[Job]');
        this.data.build = ko.observable('[Build]');

        /**
         * Update the class of the widget. More visible
         * status changes.
         */
        this.data.status.subscribe(function (value) {
            $("#widget-" + self.id + " .box").attr("class", "box jenkins " + value);
        });

        this.fields.add(new TextField(
            'Jenkins URL',
            function() { return self.settings.url; },
            function(value) { self.settings.url = value; }
        ));
    },
    defaults: {
        'interval': 30000,
        'url': ''
    },
    content: function () {
        var body = '<h3 data-bind="text: data.title"></h3>';
        body += '<div class="row">';
        body += '<div class="col-md-8">';
        body += '<p>Build Number : <span data-bind="text: data.build"></span></p>';
        body += '</div>';
        body += '<div class="col-md-4 text-center">';
        body += '<span class="glyphicon status jenkins" data-bind="css: data.status"></span>';
        body += '</div>';
        body += '</div>';

        return body;
    },
    load: function () {

        var self = this._super();

        if (self.settings.url)
        {
            $.get(self.settings.url, {}, function (data) {

                self.data.status(data.status);
                self.data.title(data.title);
                self.data.build(data.build);

                self.schedule();
            });
        }
        else
        {
            self.schedule();
        }
    }
});

Jenkins.config = {
    type: 'jenkins-build',
    description: 'This widget hooks into a Jenkins CI server to pull details about build statuses.',
    width: 2,
    height: 1
}

app.styles.add('.jenkins.status { font-size: 46px; }');
app.styles.add('.jenkins.status.green { color: #7cac40; } .status.green:before {content:"\\e013"}');
app.styles.add('.jenkins.status.grey:before {content:"\\2a"}');
app.styles.add('.jenkins.status.red { color: #ad3e37; } .status.red:before {content:"\\e014"}');
app.styles.add('.box.jenkins.red { background-color: #f4e5e5; border-color: #b87b7b; color: #b87b7b; }');
app.styles.add('.box.jenkins.green { background-color: #edf6e5; border-color: #87aa67; color: #87aa67; }');

app.register(Jenkins);