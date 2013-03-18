// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
module.exports = walker;

var fs = require("fs"),
    _path = require("path"),
    Ignorer = require("./ignorer"),
    ignorer = null,
    isBinaryFile = require("isbinaryfile"),
    binaryBuffer = new Buffer(512),
    allPaths = {},
    allContents = {},
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
  ignorer = new Ignorer(options.exclusions, options.exclusionsLength);
  options.hidden = options.hidden || false;

  // called at the end of the walk
  finalizer = function() {
    require('./finalizer')(options, allPaths, allContents, printCb, done);
  }

  statter = function (startingPath, parent, path) {
    job(1);
    var statAction = function fn(stat) {
      job(-1);
      if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths[parent].push(path);
        }
        else {
          var fd = fs.openSync(path,'r');
          var bytes = fs.readSync(fd, binaryBuffer, 0, 512, 0);

          if (!isBinaryFile(binaryBuffer, stat.size)) {
            // we have a file; let's read it here, so that the later
            // allPaths sort isn't so long
            var contents = fs.readFileSync(path, "utf8");

            if ( options.queryClean.test(contents) ) {
                allPaths[parent].push(path);
                allContents[path] = contents;
              }
          }

          fs.closeSync(fd);
        }
      }
      else if (stat.isDirectory()) readdir(startingPath, path);
    };
    
    // lstat is SLOW, but what other way to determine if something is a directory or file ?
    statAction(fs.lstatSync(path));
  },

  readdir = function(startingPath, path) {

    var readdirAction = function(files) {
      job(-1);
      if (!files) { return;}

      var fileCount = files.length, i = 0, prefix = path + DIR_SEP, file;
      allPaths[path] = [];

      while (i < fileCount) {
        var file = files[i++], filename = prefix + file;
        if (options.filesInclude.test(file) && !ignorer.isFileIgnored(file, filename, filename.split(DIR_SEP), options.hidden)) {
          statter(file, path, filename);
        }
      }
    };

    if (!ignorer.isDirIgnored(_path.relative(fpath, path), path, path.split(DIR_SEP), options.hidden)) {
      job(1);
      // async doesn't matter, we sort results at end anyway
      fs.readdir(path, function(err, files) {
        readdirAction(files);
      }); 
    }
  };

  // This is the main entry point
  readdir(fpath, fpath);
}