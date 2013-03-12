// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
module.exports = walker;

var fs = require("fs"),
    _path = require("path"),
    ignorer = require("./ignorer"),
    isBinaryFile = require("isbinaryfile"),
    allPaths = {},
    allFiles = {},
    ended = 0,
    jobs = 0, 
    DIR_SEP = _path.sep,

    // makes sure we're asynching right
    job = function(value) {
      jobs += value;

      if(value < 1 && !tick) {
        tick = 1;
        process.nextTick(function(){
          tick = 0;
          if(jobs <= 0 && !ended) {
            ended = 1;
            finalizer();
          }
        });
      }
    }, tick = 0;

walker.walkdir = function(fpath, options, printCb, done) {
  // if there are ignore rules, properly set them up
  options.exclusions = options.exclusionsLength > 0 ? ignorer.makeRules(options.exclusions, options.exclusionsLength) : "";
  options.hidden = options.hidden || false;

  // called at the end of the walk
  finalizer = function() {
    require('./finalizer')(options, allPaths, allFiles, printCb, done);
  }

  statter = function (parent, path) {
    job(1);
    var statAction = function fn(stat) {
      job(-1);
      if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths[parent].push(path);
        }
        else {
          var fd = fs.openSync(path,'r');
          var buffer = new Buffer(1024);
          var bytes = fs.readSync(fd, buffer, 0, 1024, 0);

          if (!isBinaryFile(buffer, stat.size)) {
            allFiles[path] = {};
            allFiles[path].stat = stat;
          }

          fs.closeSync(fd);
        }
      }
      else if (stat.isDirectory()) readdir(path);
    };
    
    // not sure why, but sync here is like 200ms faster than async;
    // still, lstat is SLOW, but what other way to determine if something is a directory or file ?
    statAction(fs.lstatSync(path));
  },

  readdir = function(path) {

    var readdirAction = function(files) {
      job(-1);
      if (!files) { return "Permission error (or other failure) on: " + files; }

      var fileCount = files.length, i = 0;
      allPaths[path] = [];

      while (i < fileCount) {
        var file = files[i++], filename = path + DIR_SEP + file;
        if (options.filesInclude.test(file) && !ignorer.isIgnored(options.exclusions, options.exclusionsLength, filename, options.hidden)) {
          statter(path, filename);
        }
      }
    };

    if (!ignorer.isIgnored(options.exclusions, options.exclusionsLength, path, options.hidden)) {
      job(1);
      // async doesn't matter, we sort results at end anyway
      fs.readdir(path, function(err, files) {
        if (err) { console.error(err); process.exit(1); }
        readdirAction(files);
      }); 
    }
  };

  // This is the main entry point

  // from a pipe, we're going to get an array of file names
  // just toss them to be processed
  if (options.piped) {
    var files = fpath.split("\n");
    for (var f = 0, filesLength = files.length; f < filesLength; f++) {
      if (files[f].length)
        statter(files[f]);
    }
  }
  else
    readdir(fpath);
}