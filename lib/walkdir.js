// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
var readdir, readdirAction, statter, finalizer;
module.exports = walker;
// always use /
// since windows handles well paths with forward slashes
// and we need .nakignore files to work the same on all platforms
var fs = require("fs"),
    path = require("path"),
    PathFilter = require("./path-filter"),
    pathFilter = null,
    allPaths = {},
    allStats = {},
    ended = 0,
    jobs = 0,
    DIR_SEP = "/",

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
  pathFilter = new PathFilter(options.inclusions, options.exclusions, options.hidden);

  // called at the end of the walk
  finalizer = function() {
    require('./finalizer')(fpath, options, allPaths, allStats, printCb, done);
  },

  statter = function (parent, filepath) {
    job(1);
    var statAction = function(stat) {
      if (options.follow && stat.isSymbolicLink()) {
        try {
          stat = fs.statSync(fpath + filepath);
        } catch (e) {
          job(-1);
          return;
        }
      }

      job(-1);

      // TODO: this could probably be cleaned up
      if (stat.isFile() && pathFilter.isPathAccepted(filepath)) {
        if (!options.list)
          allStats[filepath] = stat;
        if (allPaths[parent] === undefined)
          allPaths[parent] = [];

        allPaths[parent].push(filepath);
      }
      else if (stat.isDirectory() && pathFilter.isPathAccepted(filepath + DIR_SEP)) {
        readdir(filepath + DIR_SEP);
      }
    };

    // lstat is SLOW, but what other way to determine if something is a directory or file ?
    // also, sync is about 200ms faster than async...
    statAction(fs.lstatSync(fpath + filepath));
  },

  readdirAction = function(files, filepath) {
    job(-1);
    if (!files) { return; }

    var fileCount = files.length, prefix = filepath;
    while (fileCount--) {
      var file = files.shift(), filename = prefix + file;
      statter(filepath, filename);
    }
  },

  readdir = function(filepath) {
    job(1);
    // async doesn't matter, we sort results at end anyway
    fs.readdir(fpath + filepath, function(err, files) {
      readdirAction(files, filepath);
    });
  };

  readdir(DIR_SEP);
};
