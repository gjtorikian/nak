// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.

var walker = {};
module.exports = walker;

var fs = require("fs"),
    _path = require("path"),
    StringDecoder = require('string_decoder').StringDecoder,
    decoder = new StringDecoder('utf8'),
    ignorer = require("./ignorer"),
    isBinaryFile = require("isbinaryfile"),
    mergesort = require("./mergesort"),
    allPaths = [],
    allFiles = {},
    ended = 0,
    jobs = 0, 

    // to make sure we're asynching right
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
  options.maxdepth = options.maxdepth || Infinity;
  // if there are ignore rules, properly set them up
  options.exclusions = options.exclusionsLength > 0 ? ignorer.makeRules(options.exclusions, options.exclusionsLength) : "";
  options.hidden = options.hidden || false;

  // called at the end of the walk
  finalizer = function() {
    if (options.list) {
      printCb(mergesort(allPaths).join("\n"));
    }
    else {
      var matchedFiles = mergesort(Object.keys(allFiles));

      for (var m = 0, allFilesLength = matchedFiles.length; m < allFilesLength; m++) {
        var path = matchedFiles[m];
        var fileBuffer = fs.readFileSync(path);

        if (!isBinaryFile(fileBuffer, allFiles[path].stat.size)) {
          var contents = decoder.write(fileBuffer);

          options.query.lastIndex = 0;
          // don't bother working if there's not even a match
          if ( options.query.test(contents) ) {
            var oMatchCount = contents.match(options.query).length, 
                matchCount = oMatchCount, 
                lines = "";

            if (options.replacement) {
              var replacedContents = contents.replace(options.query, options.replacement);
              fs.writeFile(path, replacedContents, "utf8");
            }

            var contents = contents.split("\n");

            for (var i = 0, strLength = contents.length; matchCount && i < strLength; i++) {
              options.query.lastIndex = 0; // query is set with "g" so this resets the position
              if (options.query.test(contents[i])) {
                lines += "\t" + (i+1) + ": " + (options.replacement ? contents[i].replace(options.query, options.replacement) : contents[i]) + "\n"; 
                matchCount--;            
              }
            }

            printCb(path, lines, oMatchCount, matchedFiles);
          }
        }
      }

      done();
    }
  }

  statter = function (path, depth) {
    job(1);
    var statAction = function fn(stat) {
      job(-1);
      if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths.push(path);
        }
        else {
          allFiles[path] = {};
          allFiles[path].stat = stat;
        }
      }
      else if (stat.isDirectory()) readdir(path,depth);
    };
    
    // not sure why, but sync here is like 200ms faster than async;
    // still, lstat is SLOW, but what other way to determine if something is a directory or file ?
    statAction(fs.lstatSync(path));
  },

  readdir = function(path,depth){
    if (depth >= options.maxdepth){
      return;
    }

    var readdirAction = function(files) {
      job(-1);
      if (!files) { return "Permission error (or other failure) on: " + files; }

      var fileCount = files.length, i = 0;
      
      while (i < fileCount) {
        var file = files[i++], filename = path + "/" + file;
        if (options.filesInclude.test(file) && !ignorer.isIgnored(options.exclusions, options.exclusionsLength, filename, options.hidden)) {
          statter(filename, (depth || 0)+1);
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
    readdir(fpath,1);
}