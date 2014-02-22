<html>
    <head>
        <title>NodeDash</title>
        <link href='http://fonts.googleapis.com/css?family=Roboto+Condensed' rel='stylesheet' type='text/css'>
        <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.0/css/bootstrap.min.css" type="text/css" />
        <link rel="stylesheet" href="/css/third/gridly.css" type="text/css" />
        <link rel="stylesheet" href="/css/third/rickshaw.min.css" type="text/css" />
        <link rel="stylesheet" href="/css/style.css" type="text/css" />

        <script src="/socket.io/socket.io.js"></script>
        <script src="/graphique/core.js"></script>
        <script src="/js/script.js"></script>
        <script src="/js/widget/graphite.js"></script>
        <script src="/js/widget/jenkins.js"></script>
        <script src="/js/widget/labels.js"></script>
    </head>

    <body data-bind="css: { 'noanimation': !animating() }">

        <style type="text/css" data-bind="html: styles.all"></style>

        <div data-bind="visible: !socket.io()" class="text-center">
            <div class="jumbotron create-well">
                Attempting to connect to the local server web socket...
            </div>
        </div>

        <div data-bind="visible: !dashboard.active() && newDash" class="text-center">
            <div class="jumbotron create-well">
                Do you want to create a new dashboard?<br/><span data-bind="text: dashboard.struct.getField('id').value"></span>
                <br/>
                <button type="submit" data-bind="click: dashboard.save.bind(dashboard)" class="btn btn-primary">Create Now</button>
            </div>
        </div>




        <div data-bind="with: dashboard.active">

            <nav class="navbar navbar-default" role="navigation">
                <div class="navbar-header">

                    <div class="dropdown navbar-brand">
                        <div class="dropdown-toggle" data-toggle="dropdown">
                            <span href="#" data-bind="text: struct.getField('title').value"></span>
                            <b class="caret"></b>
                        </div>
                        <ul class="dropdown-menu" role="menu">
                            <!-- ko foreach: $root.dashboard.panels -->
                                <li data-bind="click: $root.dashboard.setActivePanel.bind($root.dashboard, $index())">
                                    <div data-bind="text: struct.getField('title').value"></div>
                                    <a class="glyphicon glyphicon-cog pull-right" data-bind="click: showSettings"></a>
                                </li>
                            <!-- /ko -->
                            <li data-bind="click: $root.dashboard.newPanel.bind($root.dashboard)" class="grey">
                                <div>New Panel</div>
                                <span class="glyphicon glyphicon-plus pull-right"></span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class='graphique-time'></div>

                <ul class="nav navbar-nav navbar-right">
                    <li><a data-bind="click: addWidgetSettings" class='glyphicon glyphicon-plus' title="Add Widget"></a></li>
                    <li><a data-bind="click: $root.dashboard.save.bind($root.dashboard)" class='glyphicon glyphicon-floppy-save' title="Save Changes"></a></li>
                    <li><a data-bind="css: { 'down': $root.rotating() }, click: $root.toggleRotate.bind($root)" class='glyphicon glyphicon-repeat' title="Rotate Dashboards"></a></li>
                    <li><a data-bind="css: { 'down': $root.animating() }, click: $root.toggleAnimation.bind($root)" class='glyphicon glyphicon-facetime-video' title="Animations"></a></li>
                    <li><a data-bind="click: $root.dashboard.showSettings.bind($root.dashboard)" class='glyphicon glyphicon-cog' title="Configuration"></a></li>
                </ul>
            </nav>


            <div class="container">
                <div class="grid gridly" data-bind="foreach: { data: widgets, afterRender: $root.dashboard.applyWidget }, updateGrid: widgets">
                    <div class="brick" data-bind="attr: { 'data-id': id, 'data-col': $data.constructor.config.width, 'data-row': $data.constructor.config.height }, template: { name: 'widget-template', data: $data }"></div>
                </div>
            </div>

        </div>


        <script type="text/html" id="widget-template">
            <div id="widget-" data-bind="attr: { id: 'widget-' + id }">
                <div data-bind="attr: { class: className }">
                    <div class="header">
                        <h2 data-bind="text: struct.getField('title').value"></h2>
                        <a data-bind="click: showSettings" class="glyphicon glyphicon-cog"></a>
                    </div>
                    <div data-bind="html: render()"></div>
                </div>
            </div>
        </script>

        <script type="text/html" id="widget-add">
            <div class='header'>
                <h3 style='display: inline-block;'>Add Widget</h3>
                <button type="button" class="close" aria-hidden="true" data-bind="click: removeSettings">&times;</button>
            </div>
            <div data-bind="foreach: type">
                <div class="row widget">
                    <div class="col-md-9">
                        <h4 data-bind="text: config.type"></h4>
                        <p data-bind="text: config.description"></p>
                    </div>
                    <div class="col-md-3 text-right">
                        <a class="glyphicon glyphicon-plus" data-bind="click: function () { $root.dashboard.active().addWidget(config.type); }"></a>
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

                <ul class="nav nav-tabs" data-bind="foreach: struct.tabs">
                    <li data-bind="css: { 'active': $index() == 0 }">
                        <a data-bind="text: name, attr: { 'href': '#' + toDom(name), 'data-toggle': 'tab' }"></a>
                    </li>
                </ul>

                <div class="tab-content" data-bind="foreach: struct.tabs">
                    <div data-bind="css: { 'tab-pane': true, 'active': $index() == 0 }, attr: { 'id': toDom(name) }">
                        <div data-bind="foreach: { data: fields, afterRender: $root.bindField }">
                            <div data-bind="html: renderFull()"></div>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" data-bind="click: saveSettings">
                    Submit
                </button>

                <button type="submit" class="btn btn-danger pull-right" data-bind="click: remove">
                    Remove
                </button>
            </div>
        </script>

        <script type="text/html" id="widget-busy">
            <div class="load">
                <div class="header">
                    <h3>Busy</h3>
                </div>
                <div>
                    <p class="lead">Please standby...</p>
                </div>
            </div>
        </script>
    </body>
</html>