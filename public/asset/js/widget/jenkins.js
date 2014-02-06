var Jenkins = Widget.extend({
    path: "/api/json?pretty=true&depth=1",
    init: function (settings) {
        var self = this;
        self._super(settings);

        self.data = [];
        self.data.status = ko.observable('grey');
        self.data.title = ko.observable('[Job]');
        self.data.build = ko.observable('[Build]');

        // Add custom class
        self.classes.push('jenkins');

        /**
         * Update the class of the widget. More visible
         * status changes.
         */
        self.data.status.subscribe(function (value) {
            self.classes.push(value);
        });

        // Remove the value before it changes
        self.data.status.subscribe(function (value) {
            if (value && self.classes.indexOf(value) != -1) {
                self.classes.splice(self.classes.indexOf(value));
            }
        }, null, 'beforeChange');

        // Configure Jenkins custom fields && Tab
        var jenkinsTab = new Tab('Jenkins');
        // Push the URL into Jenkins settings
        var jenkinsUrl = new TextField('Jenkins URL', '');
        jenkinsTab.fields.push(jenkinsUrl);

        // Push the job listing into Jenkins settings
        var jenkinsJob = new RadioBox('Jenkins Job', false, []);

        jenkinsJob.onInit(function () {
            // Get the job list from jenkins. Private method.
            var getJobs = function (value) {
                if (value != '') {
                    Remote.request(value + self.path, function (data) {
                        jenkinsJob.options([]);

                        var data = JSON.parse(data);
                        var data = data.jobs;

                        for (var key in data) {
                            jenkinsJob.options.push({ name: data[key].name, value: data[key].name });
                        }
                    });
                }
            }

            // Register a subscriber that pulls new jobs when the Jenkins URL
            // changes
            jenkinsUrl.data.subscribe(function (value) {
                getJobs(value);
            });

            // Load the list on first init based on the buffer
            // value of the jenkinsUrl form.
            getJobs(jenkinsUrl.data());
        });

        jenkinsTab.fields.push(jenkinsJob);

        // Add the fields
        self.struct.tabs.push(jenkinsTab);
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
    load: function (done) {
        var self = this._super();
        var jenkinsUrl = self.struct.getField('jenkins-url').value();
        var jenkinsJob = self.struct.getField('jenkins-job').value();

        if (!jenkinsUrl || !jenkinsJob)
        {
            done();
            return true;
        }

        // Request new information
        Remote.request(jenkinsUrl + self.path, function (data) {
            data = JSON.parse(data);

            for (var key in data.jobs) {
                var job = data.jobs[key];

                if (job.name == jenkinsJob) {
                    self.data.status(job.color);

                    var temp = job.displayName.substr(0, 25);
                    if (job.displayName.length > 25) {
                        temp + " ...";
                    }

                    self.data.title(temp);
                    self.data.build(job.lastBuild.number);
                }
            }

            done();
        });
    }
});

Jenkins.config = {
    type: 'jenkins-build',
    description: 'This widget hooks into a Jenkins CI server to pull details about build statuses.',
    width: 2,
    height: 1
}


Application.styles.add('.jenkins h3 { margin-top: 0px; height: 46px; }');
Application.styles.add('.jenkins.status { font-size: 46px; }');
Application.styles.add('.jenkins.status.blue { color: #7cac40; } .status.blue:before {content:"\\e013"}');
Application.styles.add('.jenkins.status.blue_anime { color: #5A93CC; } .status.blue_anime:before {content:"\\e023"}');
Application.styles.add('.jenkins.status.grey:before {content:"\\2a"}');
Application.styles.add('.jenkins.status.red { color: #ad3e37; } .status.red:before {content:"\\e014"}');
Application.styles.add('.box.jenkins.red { background-color: #f4e5e5; border-color: #b87b7b; color: #8A4A4A; }');
Application.styles.add('.box.jenkins.blue { background-color: #edf6e5; border-color: #87aa67; color: #87aa67; }');
Application.styles.add('.box.jenkins.blue_anime { background-color: #E8F3FA; border-color: #ACC9E6; color: #5A93CC; }');

Application.registerWidgetType(Jenkins);