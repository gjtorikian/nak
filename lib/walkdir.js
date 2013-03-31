// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
var finalizer, readdir, statter;
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
    //require('./finalizer')(options, allPaths, allStats, printCb, done);
  }

  statter = function (parent, filepath) {
    job(1);
    var statAction = function fn(stat) {
      job(-1);
      if (stat.isFile()) { // i.e. not a symlink or other madness

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

    var readdirAction = function(files, fpSplit) {
      job(-1);
      if (!files) { return; }

      var fileCount = files.length, prefix = filepath + DIR_SEP;

      while (fileCount--) {
        var file = files.shift(), filename = prefix + file, prefixSplit = fpSplit;
        prefixSplit.push(file);
        if (options.filesInclude.test(file) && !ignorer.isFileIgnored(file, filename, prefixSplit)) {
          statter(filepath, filename);
        }
      }
    };

    fpSplit = filepath.split(DIR_SEP);
    if (!ignorer.isDirIgnored(path.basename(filepath), filepath, fpSplit)) {
      job(1);
      // async doesn't matter, we sort results at end anyway
      fs.readdir(filepath, function(err, files) {
        readdirAction(files, fpSplit);
      }); 
    }
  };

  // This is the main entry point
  readdir(fpath);
}
