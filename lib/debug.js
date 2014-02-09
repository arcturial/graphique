var toArray = function (enu) {
  var arr = [];

  for (var i = 0, l = enu.length; i < l; i++)
    arr.push(enu[i]);

  return arr;
};

var color = {
    reset: function (message) {
        return '\033[39m' + message;
    },
    error: function (message) {
        return '\033[31m' + message;
    },
    info: function (message) {
        return '\033[36m' + message;
    },
    warn: function (message) {
        return '\033[33m' + message;
    },
    debug: function (message) {
        return '\033[39m' + message;
    }
}

var log = console.log;

console.error = function () {
    log.apply(console, [color.error('ERROR :: '), color.reset('')].concat(toArray(arguments).slice(0)));
}

console.warn = function () {
    log.apply(console, [color.warn('WARN  :: '), color.reset('')].concat(toArray(arguments).slice(0)));
}

console.info = function () {
    log.apply(console, [color.info('INFO  :: '), color.reset('')].concat(toArray(arguments).slice(0)));
}

console.log = function () {
    log.apply(console, [color.debug('DEBUG :: '), color.reset('')].concat(toArray(arguments).slice(0)));
}