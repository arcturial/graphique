/**
 * Prepare the application.
 */
$(document).ready(function() {
    // Grid settings
    var grid = {
        base: ($('.gridly').width() - (20 * 12)) / 12,
        base_h: 170,
        gutter: 20,
        columns: 12
    };

    ko.bindingHandlers.updateGrid = {
        update: function(element, valueAccessor) {
            // Unwrap the dependency on the widget elements
            var data = ko.utils.unwrapObservable(valueAccessor());

            // Deal with sizing
            $('.gridly > div').each(function() {

                // Throw the widget off screen and force the animation
                $(this).css("left", "-" + ($(this).width() - 50) + "px");
                $(this).css("top", ((Math.random() * 500) + 100) + "px");

                var col = $(this).attr("data-col");
                var row = $(this).attr("data-row");

                // Calculate width correctly
                $(this).attr(
                    "data-width",
                    ((col * (grid.base + grid.gutter)) - grid.gutter)
                );

                $(this).attr("data-height", (row * grid.base_h) + ((row - 1) * grid.gutter));

                $(this).width($(this).attr("data-width"));
                $(this).height($(this).attr("data-height"));

                // Notify the widget resize
                var id = $(this).data().id;
                $(Application.dashboard.active().get(id)).trigger('size');
            });

            // Refresh a grid
            $('.gridly').gridly(grid);
        }
    };

    // Apply KO bindings
    ko.applyBindings(Application);

    // Set up a socket to load from the data store
    var socket = io.connect('http://' + window.location.host);

    // Set the active socket IO connection and bind
    // it to the dashboard
    Socket.io(socket);
    Application.dashboard.bind();
});