// gutted from walkdir: https://github.com/soldair/node-walkdir
var fs = require("fs"),
    ignorer = require("./ignorer"),
    async = require("async"),
    allPaths = "";

module.exports = function(fpath, options, cb){
  options = options || {};
  options.maxdepth = options.maxdepth || Infinity;
  options.exclusions = options.exclusionsLength > 0 ? ignorer.makeRules(options.exclusions, options.exclusionsLength) : "";
  options.hidden = options.hidden || false;

  var q = async.queue(function (task, callback) {
      if (task.type == "file")
        fs.readFile(task.path, "utf8", callback);
  }, 250);

  var statter = function (path,depth) {
    var statAction = function fn(stat) {
      if (stat.isDirectory()) readdir(path,depth);
      else if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths += path + "\n"; // faster than, for example: [path,"\n"].join("")--but still slow-ish
        }
        else {
          var isBinary = function(fileStr) { // http://stackoverflow.com/a/10391758/213345
            var contentStart = fileStr.substring(0, 24);

            for (var i = 0, startLen = contentStart.length; i < startLen; i++) {
              var charCode = contentStart.charCodeAt(i);
              if (charCode == 65533 || charCode <= 8) {
                // 8 and below are control characters (e.g. backspace, null, eof, etc.)
                // 65533 is the unknown character
                return true;
              }
            }
            return false;
          }

          q.push({type: "file", path: path}, function (err, fileStr) {
            if (err) {
              console.error(err);
              process.exit(1);
            }
            if (!isBinary(fileStr)) {
                var lines = [], str = fileStr.split('\n'), strLength = str.length;
                
                for (var i = 0; i < strLength; i++) {
                  if (options.query.test(str[i])) lines.push([i+1, str[i]]);
                }
                var linesLength = lines.length;
                if (linesLength > 0)
                 return cb(path, lines, linesLength);
            }
            else {
               //console.log("Is binary: " + path);
            }
          });
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