var Graphite = Widget.extend({
    init: function (title, settings) {
        var self = this;
        self._super(title, settings);

        // Set the class of the widget
        self.classes.push('graphite');

        // Add the Graphite URL field.
        self.fields.add(
            new TextField(
                'Graphite URL',
                function () { return self.settings.url; },
                function (value) { self.settings.url = value; }
            )
        );

        // Add refresh cycle
        self.fields.add(
            new RadioBox(
                function () {
                    return [
                        { name: '1 Week', value: '-1weeks' },
                        { name: '1 day', value: '-1days' },
                        { name: '1 hour', value: '-1hours' }
                    ]
                },
                'Timeframe',
                function () { return self.settings.timeframe; },
                function (value) { self.settings.timeframe = value; }
            )
        );

        // Add a textarea for targets.
        self.fields.add(
            new TextArea(
                'Targets',
                function () { return self.settings.targets.join(","); },
                function (value) { self.settings.targets = value.split(","); }
            )
        );

        // Load up algorithms
        self.fields.add(
            new RadioBox(
                function () {
                    var options = Graphite.algorithms.getAsNameValue();
                    options.unshift({ name: 'None', value: '-1' });
                    return options;
                },
                'Algorithms',
                function () { return self.settings.algorithm; },
                function (value) { return self.settings.algorithm = value; }
            )
        );
    },
    defaults: {
        'interval': 30000,
        'targets': ['randomWalk("the.time.series")'],
        'url': '',
        'timeframe': '-1weeks',
        'algorithm': '-1'
    },
    content: function () {
        return '<div class="graphite-cont"></div>'
            + '<div class="graphite-legend"></div>';
    },
    load: function (schedule) {
        var self = this._super();

        if (self.settings.url) {

            // Calculate the targets
            var targets = "";
            for (var key in self.settings.targets) {
                targets += "&target=" + self.settings.targets[key];
            }

            // Request
            self.remoteRequest(
                self.settings.url + "/render/?format=json&from=" + self.settings.timeframe + "&" + targets,
                function (data) {
                    data = JSON.parse(data);
                    var series = [];

                    for (var key in data) {
                        var target = data[key];
                        var points = [];

                        for (var index in target.datapoints) {
                            var value = target.datapoints[index][0];
                            value = (value == null) ? 0 : value;

                            points.push([
                                target.datapoints[index][1] * 1000,
                                value
                            ]);
                        }

                        // Add data into series
                        series.push({
                            label: target.target,
                            data: points
                        });
                    }

                    // Result
                    var result = {
                        series: series,
                        options: {}
                    }

                    // Check if any algorithms are set
                    var algorithm = false;
                    if (algorithm = Graphite.algorithms.get(self.settings.algorithm)) {
                        result = algorithm.process(result);
                    }

                    // Redraw
                    self.drawGraph(result.series, result.options);
                    schedule.schedule();
                }
            );
        }
        else
        {
            schedule.schedule();
        }
    },
    drawGraph: function (series, override) {
        var self = this;

        // Calculate legend height
        var legends = series.length;
        var height = 17 * legends;
        $("#widget-" + self.id + " .graphite-legend").height(height);
        $("#widget-" + self.id + " .graphite-cont").height(290 - height);

        var settings = {
            series: {
                lines: {
                    fill: true,
                    fillColor: { colors: [  { opacity: 0.1 }, {opacity: 0.1 } ] },
                    lineWidth: 1
                }
            },
            legend: {
                container: "#widget-" + self.id + " .graphite-legend"
            },
            xaxis: {
                mode: "time",
                timeformat: "%m/%d"
            },
            yaxis: {
                autoscaleMargin: null
            },
            grid: {
                borderWidth: 1,
                borderColor: '#dedede',
                hoverable: true
            },
            colors: ["#FFAD33", "#B870B8", "#66CCFF", "#85E085", "#DB4D4D"]
        };

        // Extend the settings
        settings = $.extend(true, settings, override);

        // Graph configuration
        $.plot(
            "#widget-" + self.id + " .graphite-cont",
            series,
            settings
        );

        // Tooltip display function
        var tooltip = function (x, y, contents) {
            $('<div class="graphite-tooltip">' + contents + '</div>')
                .css({
                    position: 'absolute',
                    display: 'none',
                    top: y + 5,
                    left: x + 5,
                    opacity: 0.8
                })
                .appendTo("body")
                .show();
        };

        // Bind the tooltip code
        $("#widget-" + self.id + " .graphite-cont").on(
            "plothover",
            function (event, pos, item) {
                $("#x").text(pos.x.toFixed(2));
                $("#y").text(pos.y.toFixed(2));

                $(".graphite-tooltip").remove();

                if (item !== null) {
                    var x = item.datapoint[0], y = item.datapoint[1].toFixed(2);
                    var date = new Date(x);
                    date = date.getUTCFullYear() + "/" + (date.getUTCMonth() + 1) + "/" + date.getUTCDate();

                    // Show tooltip
                    tooltip(
                        item.pageX,
                        item.pageY,
                        item.series.label + "<br/> " + date + " = " + y
                    );
                }
            }
        );
    },
    apply: function () {
        this._super();
    }
});

Graphite.algorithms = {
    all: [],
    get: function (id) {
        for (var key in this.all) {
            var entry = this.all[key];
            if (entry.id == id) {
                return new entry();
            }
        }
        return false;
    },
    getAsNameValue: function () {
        var result = [];
        for (var key in this.all) {
            result.push({
                name: this.all[key].label,
                value: this.all[key].id
            });
        }
        return result;
    },
    add: function (algorithm) {
        this.all.push(algorithm);
    }
}

Graphite.config = {
    type: 'graphite-graph',
    description: 'This widget loads up an existing graphite graph for rendering.',
    width: 6,
    height: 2
}

// Add some custom styles
Application.styles.add(".box .render .graphite-cont { margin-left: 10px; margin-right: 10px; height: 290px; }");
Application.styles.add(".graphite-tooltip { background-color: #333333; border: 1px solid #11111; color: #efefef; font-family: Arial; font-size: 13px; font-weight: normal; padding: 10px; text-align: center; }");
Application.styles.add(".box .render .graphite-legend { height: 0px; margin-top: 10px; margin-left: 10px; margin-right: 10px; }");

//Application.registerWidgetType(Graphite);













var GraphiteAlgorithm = Class.extend({
    process: function (series) {
        return series;
    }
});

GraphiteAlgorithm.label = "Algorithm";
GraphiteAlgorithm.id = "algorithm";




// Set up a basic algorithm to stack the graph
var Stack = GraphiteAlgorithm.extend({
    process: function (series) {

        // Override the settings
        series.options = {
            series: {
                stack: true,
                lines: {
                    fill: true,
                    fillColor: { colors: [  { opacity: 0.6 }, {opacity: 0.6 } ] },
                    lineWidth: 0
                }
            }
        }

        return series;
    }
});

Stack.label = "Stack Datasets";
Stack.id = "stack-datasets";

Graphite.algorithms.add(Stack);




