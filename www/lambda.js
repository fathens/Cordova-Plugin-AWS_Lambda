var cordova = require("cordova/exec");

var pluginName = "AWSLambdaPlugin";

var names = [
"invoke"
];

var obj = {};

names.forEach(function(methodName) {
    obj[methodName] = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        return new Promise(function(resolve, reject) {
            cordova(resolve, reject, pluginName, methodName, args);
        });
    };
});

module.exports = obj;
