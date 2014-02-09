var GraphiqueLabels = Widget.extend({
    init: function (settings) {
        var self = this;
        self._super(settings);

        // Set the class of the widget
        self.classes.push('graphique-labels');

        // Set up default series
        self.series = [];
        self.colors = shuffle(["#FFAD33", "#B870B8", "#66CCFF", "#85E085", "#DB4D4D"]);

        // Set a higher priority
        self.request.priority = Request.PRIORITY_HIGH;
    },
    content: function () {
        return '<div class="graphique-labels-cont"></div>'
            + '<div class="graphique-labels-legend"></div>';
    },
    load: function (done) {
        var self = this._super();
        var now = new Date().getTime();

        loopOuter:
        for (var key in Debug.labels) {
            loopInner:
            // Check if we already have an entry
            for (var label in self.series) {
                if (self.series[label].label == key) {
                    self.series[label].data.push([ now, Debug.labels[key] ]);

                    // If we have more than 10 data points, start removing the first.
                    if (self.series[label].data.length > 10)
                    {
                        self.series[label].data.shift();
                    }

                    continue loopOuter;
                }
            }

            // Create first entry
            self.series.push({ label: key, data: [ now, Debug.labels[key] ] });
        }

        self.drawGraph(self.series);
        done();
    },
    drawGraph: function (series) {
        var self = this;

        // Calculate legend height
        var legends = series.length;
        var height = 17 * legends;
        $("#widget-" + self.id + " .graphique-labels-legend").height(height);
        $("#widget-" + self.id + " .graphique-labels-cont").height(290 - height);

        // Setup graph options
        var settings = {
            series: {
                lines: {
                    fill: true,
                    fillColor: { colors: [  { opacity: 0.1 }, {opacity: 0.1 } ] },
                    lineWidth: 1
                }
            },
            legend: {
                container: "#widget-" + self.id + " .graphique-labels-legend"
            },
            xaxis: {
                mode: "time",
                timeformat: "%H:%M:%S"
            },
            yaxis: {
                autoscaleMargin: null
            },
            grid: {
                borderWidth: 1,
                borderColor: '#dedede'
            },
            colors: self.colors
        };

        // Graph configuration and rendering
        $.plot("#widget-" + self.id + " .graphique-labels-cont", series, settings);
    },
    apply: function () {
        this._super();
    }
});

GraphiqueLabels.config = {
    type: 'graphique-labels',
    description: 'This widget shows stats on Debug labels (Debug.labels).',
    width: 4,
    height: 2
}

// Add some custom styles
Application.styles.add(".box.graphique-labels .render .graphique-labels-cont { margin-left: 10px; margin-right: 10px; height: 290px; }");
Application.styles.add(".box.graphique-labels .render .graphique-labels-legend { height: 0px; margin-top: 10px; margin-left: 10px; margin-right: 10px; }");

Application.registerWidgetType(GraphiqueLabels);