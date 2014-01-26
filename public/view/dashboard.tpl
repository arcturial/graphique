<html>
    <head>
        <title>NodeDash</title>
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css" type="text/css" />
        <link rel="stylesheet" href="/css/gridster.min.css" type="text/css" />
        <link rel="stylesheet" href="/css/style.css" type="text/css" />
        <link href='http://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js" ></script>
        <script src="//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js"></script>
        <script src="/js/knockout.js"></script>

        <script src="/js/opendash/ui.js"></script>
        <script src="/js/opendash/dashboard.js"></script>
    </head>

    <body>

        <nav class="navbar navbar-default" role="navigation">
            <div class="navbar-header">
                <a class="navbar-brand" href="#">OpenDash</a>
            </div>

            <ul class="nav navbar-nav navbar-right">
                <li class="dropdown">
                    <a href="javascript:void(0);" class="dropdown-toggle" data-toggle="dropdown">
                        <span class='glyphicon glyphicon-cog'></span>
                    </a>

                    <ul class="dropdown-menu">
                        <li>
                            <a href="javascript: UI.render(DashboardMeta);">
                                Add Dashboard <span class='glyphicon glyphicon-plus'></span>
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>

        </nav>


        <div class="container grid">
            <ul data-bind="foreach: dashboards">
                <li>
                    <div class='dashboard box'>
                        <h2 data-bind="text: fields().name">&nbsp;</h2>
                        <p data-bind="text: fields().desc">&nbsp;</p>
                    </div>
                </li>
            </ul>
        </div>
    </body>
</html>