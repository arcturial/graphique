var Graph = Widget.extend({
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
    }
});


var Graphite = Widget.extend({
    init: function (settings) {
        var self = this;
        self._super(settings);

        // Set the class of the widget
        self.classes.push('graphite');

        // Configure the Graphite tab
        var graphiteTab = new Tab('Graphite');

        // Push the URL into Graphite settings
        var graphiteUrl = new TextField('Graphite URL', '');
        graphiteTab.fields.push(graphiteUrl);

        // Add a radio box to select the time frame
        var graphiteTime = new RadioBox(
            'Timeframe',
            '-1weeks',
            [
                { name: '1 Week', value: '-1weeks' },
                { name: '1 day', value: '-1days' },
                { name: '1 hour', value: '-1hours' }
            ]
        );
        graphiteTab.fields.push(graphiteTime);

        // Add a textarea for targets.
        var graphiteTargets = new TextArea('Targets', 'randomWalk("the.time.series")');
        graphiteTab.fields.push(graphiteTargets);

        // Add the graphite tab
        self.struct.tabs.push(graphiteTab);

        // Graph color setup
        self.colors = shuffle(["#67001f", "#b2182b", "#d6604d", "#f4a582", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"]);
    },
    content: function () {
        return '<div class="graphite-cont"></div>'
            + '<div class="graphite-legend"></div>';
    },
    load: function (done) {
        var self = this._super();
        var graphite = self.struct.getField('graphite-url').value();
        var timeframe = self.struct.getField('timeframe').value();
        var targets = self.struct.getField('targets').value();

        if (!graphite) {
            done();
            return true;
        }

        // Calculate the targets
        var targetString = "";
        targets = targets.split(",");
        for (var key in targets) {
            targetString += "&target=" + targets[key];
        }

        // Request
        Remote.request(graphite + "/render/?format=json&from=" + timeframe + "&" + targetString, function (data) {

            try {
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
                var algorithm = new Rollup();
                result = algorithm.process(result);

                // Redraw
                self.drawGraph(result.series, result.options);
            } catch (e) {
                self.error(e);
            }
        }, function () {
            done();
        });
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
                    fillColor: { colors: [  { opacity: 0.05 }, {opacity: 0.05 } ] },
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
            colors: self.colors
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

Application.registerWidgetType(Graphite);













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

var Rollup = GraphiteAlgorithm.extend({
    process: function (series) {
        var rollup = [];

        for (var key in series.series) {
            var points = series.series[key].data;

            for (var index in points) {
                var date = new Date(points[index][0]);
                var dateKey = date.getUTCFullYear() + "/" + (date.getUTCMonth() + 1) + "/" + date.getUTCDate();

                if (typeof rollup[dateKey] === 'undefined') {
                    rollup[dateKey] = [];
                }

                if (points[index][1] > 0) {
                    rollup[dateKey].push(points[index][1]);
                }
            }

            var result = [];

//If n is odd then the median is x[(n-1)/2].
//If n is even than the median is ( x[n/2] + x[(n/2)-1] ) / 2.


            for (var innerKey in rollup) {
                var entry = rollup[innerKey];
                result.push([ new Date(innerKey).getTime(), Math.max.apply(Math, entry) ]);
            }

            series.series[key].data = result;
        }

        // Override the settings
        series.options = {
            series: {
                lines: {
                    lineWidth: 2
                }
            }
        }

        return series;
    }
});

Rollup.label = 'Rollup';
Rollup.id = 'rollup';