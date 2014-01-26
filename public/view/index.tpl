<html>
    <head>
        <title>NodeDash</title>
        <link href='http://fonts.googleapis.com/css?family=Roboto+Condensed' rel='stylesheet' type='text/css'>
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css" type="text/css" />
        <link rel="stylesheet" href="/css/third/gridster.min.css" type="text/css" />
        <link rel="stylesheet" href="/css/third/rickshaw.min.css" type="text/css" />
        <link rel="stylesheet" href="/css/style.css" type="text/css" />

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js" ></script>
        <script src="//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js"></script>
        <script src="/js/third/gridster.min.js"></script>
        <script src="/js/third/knockout.js"></script>
        <script src="/js/third/d3.min.js"></script>
        <script src="/js/third/d3.layout.min.js"></script>
        <script src="/js/third/rickshaw.min.js"></script>
        <script src="/js/third/rickshaw.min.js"></script>
        <script src="/js/third/inheritance.js"></script>
        <script src="/js/script.js"></script>
        <script src="/js/widget/widget.js"></script>
        <script src="/js/widget/graphite.js"></script>
        <script src="/js/widget/jenkins.js"></script>
        <script src="/socket.io/socket.io.js"></script>
    </head>

    <body>

        <style type="text/css" data-bind="html: styles.all"></style>

        <nav class="navbar navbar-default" role="navigation">
            <div class="navbar-header">
                <a class="navbar-brand" href="#" data-bind="text: dashboard.name"></a>
            </div>

            <ul class="nav navbar-nav navbar-right">
                <li><a data-bind="click: addWidget" class='glyphicon glyphicon-plus'></a></li>
                <li><a data-bind="click: save" class='glyphicon glyphicon-floppy-save'></a></li>
                <li><a class='glyphicon glyphicon-cog'></a></li>
            </ul>
        </nav>


        <div class="container">
            <div class="gridster"></div>
        </div>

        <script type="text/html" id="widget-template">
            <div class="box">
                <div>
                    <div class='header'>
                        <h2 data-bind="text: settings.title"></h2>
                        <a data-bind="click: showSettings" class='glyphicon glyphicon-cog'></a>
                    </div>
                </div>
                <div data-bind="html: render()"></div>
            </div>
        </script>


        <script type="text/html" id="widget-add">
            <div class='header'>
                <h3>Add Widget</h3>
            </div>
            <div data-bind="foreach: type">
                <div class="row widget">
                    <div class="col-md-9">
                        <h4 data-bind="text: config.type"></h4>
                        <p data-bind="text: config.description"></p>
                    </div>
                    <div class="col-md-3 text-right">
                        <a class="glyphicon glyphicon-plus" data-bind="click: addWidget"></a>
                    </div>
                </div>
            </div>
        </script>

        <script type="text/html" id="widget-settings">
            <div class='header'>
                <h3 style='display: inline-block;'>Settings</h3>
                <button type="button" class="close" aria-hidden="true" data-bind="click: removeSettings">&times;</button>
            </div>
            <div id="settings">
                <p data-bind="text: constructor.config.description"></p>
                <div data-bind="foreach: { data: fields.all, afterRender: bindField }">
                    <div class="form-group">
                        <label data-bind="attr: { for: name }, text: name"></label>
                        <div data-bind="html: render()"></div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" data-bind="click: saveSettings">Submit</button>
            </div>
        </script>

    </body>
</html>