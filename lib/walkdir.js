// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
module.exports = walker;

var fs = require("fs"),
    path = require("path"),
    Ignorer = require("./ignorer"),
    ignorer = null,
    isBinaryFile = require("isbinaryfile"),
    binaryBuffer = new Buffer(512),
    allPaths = {},
    ended = 0,
    jobs = 0, 
    DIR_SEP = path.sep,

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
  ignorer = new Ignorer(options.exclusions, options.exclusionsLength);
  options.hidden = options.hidden || false;

  // called at the end of the walk
  finalizer = function() {
    require('./finalizer')(options, allPaths, printCb, done);
  }

  statter = function (startingPath, parent, filepath) {
    job(1);
    var statAction = function fn(stat) {
      job(-1);
      if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths[parent].push(filepath);
        }
        else {
          var fd = fs.openSync(filepath,'r');
          var bytes = fs.readSync(fd, binaryBuffer, 0, 512, 0);

          if (!isBinaryFile(binaryBuffer, stat.size)) {
            allPaths[parent].push(filepath);
          }

          fs.closeSync(fd);
        }
      }
      else if (stat.isDirectory()) readdir(startingPath, filepath);
    };
    
    // lstat is SLOW, but what other way to determine if something is a directory or file ?
    statAction(fs.lstatSync(filepath));
  },

  readdir = function(startingPath, filepath) {

    var readdirAction = function(files) {
      job(-1);
      if (!files) { return;}

      var fileCount = files.length, i = 0, prefix = filepath + DIR_SEP, prefixSplit = filepath.split(DIR_SEP);
      allPaths[filepath] = [];

      while (i < fileCount) {
        var file = files[i++], filename = prefix + file;
        prefixSplit.push(file);
        if (options.filesInclude.test(file) && !ignorer.isFileIgnored(file, filename, prefixSplit, options.hidden)) {
          statter(file, filepath, filename);
        }
      }
    };

    if (!ignorer.isDirIgnored(path.basename(filepath), filepath, filepath.split(DIR_SEP), options.hidden)) {
      job(1);
      // async doesn't matter, we sort results at end anyway
      fs.readdir(filepath, function(err, files) {
        readdirAction(files);
      }); 
    }
  };

  // This is the main entry point
  readdir(fpath, fpath);
}