var color = {
    reset: function (message) {
        return '\x1B\[0m' + message;
    },
    error: function (message) {
        return '\x1B\[41m' + message;
    },
    info: function (message) {
        return '\x1B\[46m' + message;
    },
    warn: function (message) {
        return '\x1B\[43m' + message;
    }
}

var log = console.log;

console.error = function (message) {
    console.log(
        color.error('[ERROR]') + color.reset(' ' + message)
    );
}

console.warn = function (message) {
    console.log(
        color.warn('[WARN]') + color.reset(' ' + message)
    );
}

console.info = function (message) {
    console.log(
        color.info('[INFO]') + color.reset(' ' + message)
    );
}

console.log = function (message) {
    log(message);
}

console.out = function (message) {
    log(message);
}