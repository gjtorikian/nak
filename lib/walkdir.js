// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
module.exports = walker;

var fs = require("fs"),
    _path = require("path"),
    ignorer = require("./ignorer"),
    isBinaryFile = require("isbinaryfile"),
    allPaths = {},
    allFiles = [],
    jobs = 0, 
    DIR_SEP = _path.sep,

    // makes sure we're asynching right
    job = function(value) {
      jobs += value;

      if(value < 1 && !tick) {
        tick = 1;
        process.nextTick(function(){
          tick = 0;

          if(jobs <= 0) {
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
  },

  read = function(path, parent) {
    var readdir = function(path, files) {
      job(-1);
      if (!files) { return "Permission error (or other failure) on: " + files; }

      var fileCount = files.length, i = 0;
      
      while (i < fileCount) {
        var file = files[i++], filename = path + DIR_SEP + file;
        if (options.filesInclude.test(file) && !ignorer.isIgnored(options.exclusions, options.exclusionsLength, filename, options.hidden)) {
          read(filename, path);
        }
      }
    },

    readfile = function(path, parent) {
      job(-1);
      if (options.list) {
        if (!allPaths[parent]) allPaths[parent] = [];
        allPaths[parent].push(path);
      }
      else {
        var fd = fs.openSync(path,'r');
        var buffer = new Buffer(1024);
        var bytes = fs.readSync(fd, buffer, 0, 1024, 0);

        if (!isBinaryFile(buffer, 1024)) {
          allFiles.push(path);
        }

        fs.closeSync(fd);
      }
    };

    if (!ignorer.isIgnored(options.exclusions, options.exclusionsLength, path, options.hidden)) {
      job(1);
      // async doesn't matter, we sort results at end anyway
      fs.readdir(path, function(err, files) {
        if (err && err.code == 'ENOTDIR')
          readfile(path, parent);
        else
          readdir(path, files);
      }); 
    }
  };

  // This is the main entry point
  read(fpath);
}