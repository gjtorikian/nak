var JSONfn = require("json-fn");

exports.serialize = function(fn) {
    return JSONfn.stringify(fn).replace(/ +/g, " ");
};

exports.deserialize = function(fn) {
    return JSONfn.parse(fn);
};