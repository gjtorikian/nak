// gutted from walkdir: https://github.com/soldair/node-walkdir
// speed up a bunch.
var fs = require("fs"),
    _path = require("path"),
    StringDecoder = require('string_decoder').StringDecoder,
    decoder = new StringDecoder('utf8')
    ignorer = require("./ignorer"),
    isBinaryFile = require("isbinaryfile"),
    async = require("async"),
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
      if (task.type == "replacement")
        fs.writeFile(task.path, task.replacement, "utf8", callback);
      else
        fs.readFile(task.path, callback);
    }, 200);

module.exports = function(fpath, options, cb) {
  // set up the options (if any)
  options = options || {};
  options.maxdepth = options.maxdepth || Infinity;
  // if there are ignore rules, properly set them up
  options.exclusions = options.exclusionsLength > 0 ? ignorer.makeRules(options.exclusions, options.exclusionsLength) : "";
  options.hidden = options.hidden || false;

  // called at the end of the result
  // (or each result, for find replace)
  callback = function() {
    if (options.list)
      cb(sort(allPaths).join("\n"));
    else {
      // for queries, we're maintaing a hash with filename as key and the file contents as a result
      // we then use merge sort to get the file list in order, since we've been using an async file read
      // to quickly get the results
      var matchedFiles = sort(Object.keys(allFiles)), matchedFileLength = matchedFiles.length;
      
      for (var m = 0; m < matchedFileLength; m++) {
        var contents = allFiles[matchedFiles[m]].contents, lines = "";

        if (options.replacement)
          var replacedContents = allFiles[matchedFiles[m]].replacedContents;

        // now we have to iterate over the contents and just catch
        // the matches for the line number; we never did this before. could it be improved?
        for (var i = 0, strLength = contents.length; i < strLength; i++) {
          if (options.query.test(contents[i])) {
            if (options.c9Format) {
              lines += matchedFiles[m] + ":" + (i+1) + ":" + (options.replacement ? replacedContents[i] : contents[i]) + "\n";                 
            }
            else {
              lines += (i+1) + ":" + (options.replacement ? replacedContents[i] : contents[i]) + "\n";             
            }
          }
        }
        // stream results back
        options.c9Format ? cb("", lines) : cb(matchedFiles[m], lines);
      }
    }
  }

  // merge sort start
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
  },
  // merge sort end

  statter = function (path, depth) {
    job(1);
    var statAction = function fn(stat) {
      job(-1);
      if (stat.isFile()) { // i.e. not a symlink or other madness
        if (options.list) {
          allPaths.push(path);
        }
        else {
          job(1);
          processFiles(path, stat);
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
    job(1);
    var readdirAction = function(files) {
      job(-1);
      if (!files) {
        return "Permission error (or other failure) on: " + files;
      }

      var fileNum;
      if( !(fileNum = files.length) ) return;

      var i = 0, filePath;
      for (i; i < fileNum; i++) {
       filePath = path + "/" + files[i];

        if (!ignorer.isIgnored(options.exclusions, options.exclusionsLength, files[i], options.hidden)) {
          // given list of valid files, and we're not ignored, go ahead and only
          // print matching (if it's set)
          if (options.filesInclude.test(files[i]))
              statter(filePath,(depth || 0)+1);
        }
      }
    };

    // async doesn't matter, we sort results at end anyway
    fs.readdir(path, function(err, contents) {
      if (err) { console.error(err); process.exit(1); }
      readdirAction(contents);
    }); 
  },
  processFiles = function(path, stat) {
    q.push({type: "query", path: path}, function (err, fileBuffer) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      job(-1);
      if (!isBinaryFile(fileBuffer, stat.size)) {
        var fileString = decoder.write(fileBuffer);

        // don't bother splitting if there's not even a match
        if ( options.query.test(fileString) ) {
          // for a large file, like 75k lines, this takes ~35ms
          allFiles[path] = {contents: fileString.split("\n")};
          
          if (options.replacement) {
            var replacedContent = fileString.replace(options.query, options.replacement);
            allFiles[path].replacedContents = replacedContent.split("\n");
            q.push({type: "replacement", replacement: replacedContent, path: path}, function (err) {
              if (err) {
                console.error(err);
                process.exit(1);
              }
              job(-1);
            });
          }
        }
      }
    });
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