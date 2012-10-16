// gutted from walkdir: https://github.com/soldair/node-walkdir
var fs = require("fs"),
    StringDecoder = require('string_decoder').StringDecoder,
    decoder = new StringDecoder('utf8')
    ignorer = require("./ignorer"),
    isBinaryFile = require("isbinaryfile"),
    allPaths = "";
var XRegExp = require('xregexp').XRegExp;

module.exports = function(fpath, options, cb){
  options = options || {};
  options.maxdepth = options.maxdepth || Infinity;
  options.exclusions = options.exclusionsLength > 0 ? ignorer.makeRules(options.exclusions, options.exclusionsLength) : "";
  options.hidden = options.hidden || false;

  var statter = function (path,depth) {
    var statAction = function fn(stat) {
      if (stat.isDirectory()) readdir(path,depth);
      else if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths += path + "\n"; // faster than, for example: [path,"\n"].join("")--but still slow-ish
        }
        else {
          var fileStr = fs.readFileSync(path);

          if (!isBinaryFile(fileStr, stat.size)) {
            var str = decoder.write(fileStr);

            // don't bother splitting if there's not even a match
            if ( options.query.test(str) ) {
              var str = str.split("\n"), // even for a large file, like 75k lines, this only takes ~35ms
                  lines = "", strLength, i = 0;
               
              // this method is still faster than, say, executing matchesLeft = str.match(query).length,
              // and counting off until matchesLeft == 0
              for (var i = 0, strLength = str.length; i < strLength; i++) {
                if (options.query.test(str[i])) {
                  lines += "\t" + (i+1) + ": " + str[i] + "\n";
                }
              }

              return cb(path, lines);
            }
          }
        }
      }
    };
    
    // lstat here is SLOW, but what other way to determine if something is a directory or file ?
    if (!ignorer.isIgnored(options.exclusions, options.exclusionsLength, path, true, options.hidden)) {
      statAction(fs.lstatSync(path));
    }
  },readdir = function(path,depth){
    if(depth >= options.maxdepth){
      return;
    }

    var readdirAction = function(files) {
      if (!files) {
        return "Permission error (or other failure) on: " + files;
      }

      var fileNum, i = 0, filePath;
      if( !(fileNum = files.length) ) return;

      for (i; i < fileNum; i++) {
       filePath = path+"/"+files[i];
        if (!ignorer.isIgnored(options.exclusions, options.exclusionsLength, files[i], false, options.hidden)) {
          statter(filePath,(depth || 0)+1);
        }
      }
    };

    // needs to be sync, we want an ordered dir list back
    readdirAction(fs.readdirSync(path));
  };

  readdir(fpath,1);
  return allPaths;
}