// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
var readdir, readdirAction, statter, finalizer;
module.exports = walker;

var fs = require("fs"),
    path = require("path"),
    Ignorer = require("./ignorer"),
    ignorer = null,
    allPaths = {},
    allStats = {},
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
  ignorer = new Ignorer(options.exclusions, options.hidden);

  // called at the end of the walk
  finalizer = function() {
    require('./finalizer')(options, allPaths, allStats, printCb, done);
  },

  statter = function (parent, filepath) {
    job(1);
    var statAction = function(stat) {
      if (options.follow && stat.isSymbolicLink())
        try {
          stat = fs.statSync(filepath);
        } catch (e) {
          job(-1);
          return;
        }

      job(-1);

      // TODO: this could probably be cleaned up
      if (stat.isFile() && options.filesInclude.test(filepath)) {
        if (!options.list)
          allStats[filepath] = stat;
        if (allPaths[parent] === undefined)
          allPaths[parent] = [];

        allPaths[parent].push(filepath);
      }
      else if (stat.isDirectory())
        readdir(filepath);
    };

    // lstat is SLOW, but what other way to determine if something is a directory or file ?
    // also, sync is about 200ms faster than async...
    statAction(fs.lstatSync(filepath));
  },

  readdir = function(filepath) {
    if (!ignorer.isDirIgnored(path.basename(filepath), filepath)) {
      job(1);
      // async doesn't matter, we sort results at end anyway
      fs.readdir(filepath, function(err, files) {
        readdirAction(files, filepath);
      });
    }
  },

  readdirAction = function(files, filepath) {
    job(-1);
    if (!files) { return; }

    var fileCount = files.length, prefix = filepath + DIR_SEP;
    while (fileCount--) {
      var file = files.shift(), filename = prefix + file;
      if (!ignorer.isFileIgnored(filename)) {
        statter(filepath, filename);
      }
    }
  };

  // TODO: deduplicate this. we basically need to just omit the "hidden folder" rule
  var firstIgnorer = new Ignorer(options.exclusions, true);
  // This is the main entry point; we're duplicating ourselves here to solve
  // a bug where the original dir might be accidentally ignored; see http://git.io/2ZiOBw

  if (!firstIgnorer.isDirIgnored(fpath, fpath)) {
    job(1);
    fs.readdir(fpath, function(err, files) {
      readdirAction(files, fpath);
    });
  }
};
