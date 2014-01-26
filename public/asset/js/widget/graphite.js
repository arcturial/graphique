var Graphite = Widget.extend({
    init: function (title) {
        this._super(title);

        this.graph = null;
        this.data = [
            [{ x: -1893456000, y: 25868573 }, { x: -1577923200, y: 29662053 }, { x: -1262304000, y: 34427091 }, { x: -946771200, y: 35976777 }, { x: -631152000, y: 39477986 }, { x: -315619200, y: 44677819 }, { x: 0, y: 49040703 }, { x: 315532800, y: 49135283 }, { x: 631152000, y: 50809229 }, { x: 946684800, y: 53594378 }, { x: 1262304000, y: 55317240 }],
            [{ x: -1893456000, y: 29888542 }, { x: -1577923200, y: 34019792 }, { x: -1262304000, y: 38594100 }, { x: -946771200, y: 40143332 }, { x: -631152000, y: 44460762 }, { x: -315619200, y: 51619139 }, { x: 0, y: 56571663 }, { x: 315532800, y: 58865670 }, { x: 631152000, y: 59668632 }, { x: 946684800, y: 64392776 }, { x: 1262304000, y: 66927001 }],
        ];
    },
    defaults: {
        'width': 6,
        'interval': 30000,
        'height': 2
    },
    content: function () {
        return ''
            + '<style type="text/css">'
            + '.graph-cont { position: relative; height: 262px; }'
            + '.y-axis { position: absolute; left: 0px; top: 0px; width: 40px; height: 100%; }'
            + '.x-axis { position: absolute; left: 0px; bottom: 0px; height: 100%; }'
            + '.graph { position: absolute; left: 40px; top: 0px; height: 100%; }'
            + '</style>'
            + '<div class="graph-cont">'
            + '<div id="y-axis-' + this.id + '" class="y-axis" style="fill:#000000;"></div>'
            + '<div id="graph-' + this.id + '" class="graph" style="fill:#000000;color:#000000;"></div>'
            + '</div>';
    },
    load: function () {



    },
    postApply: function () {

        var container = $("#widget-" + this.id + " .box");
        var palette = new Rickshaw.Color.Palette( { scheme: 'spectrum2000' } );

        this.graph = new Rickshaw.Graph({
            element: document.getElementById("graph-" + this.id),
            width: container.width() - 60,
            height: 230,
            renderer: 'area',
            stroke: true,
            padding: { top: 0.2 },
            strokeWidth: 4,
            series: [
                { data: this.data[0], name: 'Moscow', color: palette.color() },
                { data: this.data[1], name: 'Shanghai', color: palette.color() }
            ]
        });

        var xAxis = new Rickshaw.Graph.Axis.Time({
            graph: this.graph
        });

        var yAxis = new Rickshaw.Graph.Axis.Y({
            graph: this.graph,
            orientation: 'left',
            tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
            element: document.getElementById('y-axis-' + this.id)
        });


        this.graph.render();
        //xAxis.render();
        //yAxis.render();
    }
});