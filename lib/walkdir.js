// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.
var fs = require("fs"),
    _path = require("path"),
    StringDecoder = require('string_decoder').StringDecoder,
    decoder = new StringDecoder('utf8')
    ignorer = require("./ignorer"),
    isBinaryFile = require("isbinaryfile"),
    async = require("async"),
    XRegExp = require('xregexp').XRegExp,
    allPaths = [],
    allFiles = {},
    pathIdx = 0,
    ended = 0,
    jobs=0, 
    callback= "",

    // to make sure we're asynching right
    job = function(value) {
      jobs += value;
      if(value < 1 && !tick) {
        tick = 1;
        process.nextTick(function(){
          tick = 0;
          if(jobs <= 0 && !ended) {
            ended = 1;
            callback();
          }
        });
      }
    }, tick = 0,

    // to avoid EMFILE issues
    q = async.queue(function (task, callback) {
      job(1);
      if (task.type == "replacement") {
        fs.writeFile(task.path, task.replacement, "utf8", callback);
      }
      else if (!task.string)
        fs.readFile(task.path, callback);
      else
        fs.readFile(task.path, "utf8", callback);
    }, 250);

module.exports = function(fpath, options, cb){
  options = options || {};
  options.maxdepth = options.maxdepth || Infinity;
  options.exclusions = options.exclusionsLength > 0 ? ignorer.makeRules(options.exclusions, options.exclusionsLength) : "";
  options.hidden = options.hidden || false;

  callback = function() {
    if (options.list)
      cb(sort(allPaths).join("\n"));
    else {
      var matchedFiles = sort(Object.keys(allFiles)), matchedFileLength = matchedFiles.length;
      for (var m = 0; m < matchedFileLength; m++) {
        var content = allFiles[matchedFiles[m]], lines = "";

        for (var i = 0, strLength = content.length; i < strLength; i++) {
          if (options.query.test(content[i])) {
            lines += "\t" + (i+1) + ": " + content[i] + "\n";
          }
        }
        cb(matchedFiles[m], lines);
      }
    }
  }
  var sort = function(array) {
    var len = array.length;
    if(len < 2) { 
      return array;
    }
    var pivot = Math.ceil(len/2);
    return merge(sort(array.slice(0,pivot)), sort(array.slice(pivot)));
  }, merge = function(left, right) {
    var result = [];
    while((left.length > 0) && (right.length > 0)) {
      if(left[0] > right[0]) {
        result.push(right.shift());
      }
      else {
        result.push(left.shift());
      }
    }

    result = result.concat(left, right);
    return result;
  }, statter = function (path,depth) {
    job(1);
    var statAction = function fn(stat) {
      job(-1);
      if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths.push(path);
        }
        else {
          q.push({type: "query", path: path}, function (err, fileBuffer) {
            job(-1);
            if (err) {
              console.error(err);
              process.exit(1);
            }
            if (!isBinaryFile(fileBuffer, stat.size)) {
              var fileString = decoder.write(fileBuffer);

              // don't bother splitting if there's not even a match
              if ( options.query.test(fileString) ) {
                if (options.replacement) {
                  q.push({type: "replacement", replacement: fileString.replace(options.query, options.replacement), path: path}, function (err) {
                    job(-1);
                    if (err) {
                      console.error(err);
                      process.exit(1);
                    }
                  });
                }
                else {
                  allFiles[path] = fileString.split("\n"); // for a large file, like 75k lines, this takes ~35ms
                }
              }
            }
          });
        }
      }
      else if (stat.isDirectory()) readdir(path,depth);
    };
    
    // lstat here is SLOW, but what other way to determine if something is a directory or file ?
    //if (!ignorer.isIgnored(options.exclusions, options.exclusionsLength, path, true, options.hidden)) {
      fs.lstat(path, function(err, stat) {
        statAction(stat);
      });
    //}
  },readdir = function(path,depth){
    if(depth >= options.maxdepth){
      return;
    }
    job(1);
    var readdirAction = function(files) {
      job(-1);
      if (!files) {
        return "Permission error (or other failure) on: " + files;
      }

      var fileNum, i = 0, filePath;
      if( !(fileNum = files.length) ) return;

      for (i; i < fileNum; i++) {
       filePath = [path, files[i]].join("/");
        if (!ignorer.isIgnored(options.exclusions, options.exclusionsLength, files[i], false, options.hidden)) {
          statter(filePath,(depth || 0)+1);
        }
      }
    };

    // needs to be sync, we want an ordered dir list back
    fs.readdir(path, function(err, contents) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      readdirAction(contents);
    }); 
  };

  if (!options.replace)
    readdir(fpath,1);
  else {
    if (options.piped) {
      var files = fpath.split("\n"), filesLength = files.length;
      for (var f = 0; f < filesLength; f++) {
        job(1);
        q.push({type: "file", string: true, path: files[f]}, function (err, fileBuffer) {
          job(-1);
          if (err) {
            console.error(err);
            process.exit(1);
          }
          if (!isBinaryFile(fileBuffer, stat.size)) {
            var str = decoder.write(fileBuffer);

            // don't bother splitting if there's not even a match
            if ( options.query.test(str) ) {
              allFiles[path] = str.split("\n"); // even for a large file, like 75k lines, this only takes ~35ms
            }
          }
        });
      }
    }
    else {

    }
  }
}