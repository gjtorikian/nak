// used when nak is run from a script
exports.run = function(passedOptions) {
  // from the bin
  if (passedOptions === undefined) {
    var options = process.argv;
    options.splice(0, 2)
    options = require("../lib/options").parseArgs(options);
    main(options);
  }
  // from a script
  else {
    passedOptions.args = [passedOptions.query, passedOptions.replacement, passedOptions.path];
    main(passedOptions);
  }
}

function main(options) {
var fs = require('fs'),
    path = require('path'),
    walkdir = require('../lib/walkdir').walkdir,
    ignorer = require('../lib/ignorer');

// arguments
var fpath = path.resolve(options.args.pop()),
    replacement = null,
    query = null,
    fileColor = "", textColor = "", matchColor = "";

if (options.args.length == 1)
  query = options.args.pop();
else if (options.args.length == 2) {
  replacement = options.args.pop();
  query = options.args.pop();
}

if (options.color) {
  fileColor = '\n\033[36m%s\033[0m';
  textColor = '\033[37;43m\1\033[0;90m';
  matchColor = '\033[90m%s';
}

options.filesInclude = options.fileSearch ? ignorer.makeWildcardRegExp(options.fileSearch, true) : { test: function(){ return true }};

setExclusions(fpath);

// set the query up, and present a final summary; also, pump out results as they come.
// "streaming" output like this is slower (because console.log blocks)
// but serves a purpose when finding text
if (typeof callback != "undefined") {
  var Stream = require('stream').Stream;
  var stream = new Stream();
  stream.readable = true;
    
  callback(null, {stream: stream});
    
  if (query) {
    makeQuery(query, replacement);
    var matches = 0, filecount = 0;
    var output = "";
  
    walkdir(fpath, options, function(file, lines, _matches) {  
      stream.emit("data", file + "\n" + lines);
      matches += _matches;
      filecount++;
    }, function() {
      if (!options.ackmate)
        stream.emit("data", "Found " + matches + (matches == 1 ? " match" : " matches")  
          + " in " + filecount + (filecount == 1 ? " file " : " files ")); 
      
      stream.emit("end", {count : matches, filecount: filecount});
    });
  }
  // if we're listing, callback at the very end
  else if (options.list) {
    walkdir(fpath, options, function(lines) {
        stream.emit("data", lines);
        stream.emit("end");
    });
  }
}
else if (query) {
  makeQuery(query, replacement);
  var matches = 0, filecount = 0;

  walkdir(fpath, options, function(file, lines, _matches) {  
    if (!options.color) {
      console.log(file);
      console.log(lines);
    }
    else {
      console.log(fileColor, file + ":");
      lines = lines.replace(options.query, textColor);
      console.log(matchColor, lines);
    }

    matches += _matches;
    filecount++;
  }, function() {
    if (!options.ackmate)
      console.log("Found " + matches + (matches == 1 ? " match" : " matches")  
        + " in " + filecount + (filecount == 1 ? " file " : " files ")); 
  });
}
// if we're listing, callback at the very end
else if (options.list) {
  walkdir(fpath, options, function(lines) {
    console.log(lines);
  });
}

function setExclusions(fpath) {
  var referencedExclusions = "",
      nakExclusions = "",
      gitExclusions = "";

  // if these ignore files don't exist, don't worry about them
  if (options.pathToNakignore) {
  try {
      referencedExclusions = fs.readFileSync(options.pathToNakignore, "utf-8");
    } catch (e) { };
  }

  try {
    nakExclusions = fs.readFileSync(fpath + path.sep + ".nakignore", "utf8");
  } catch (e) { };

  if (options.addVCSIgnores) {
    try {
      gitExclusions = fs.readFileSync(fpath + path.sep + ".gitignore", "utf8");
    } catch (e) { };
  }
  
  var combinedExclusions = referencedExclusions + "\n" + 
                           nakExclusions + "\n" + 
                           gitExclusions + "\n" + 
                           (options.ignore || "").replace(/,/g, "\n");

  if (combinedExclusions.length) {
    options.exclusions = combinedExclusions.split(/\r?\n/);
  }
};

function makeQuery(query, replacement) {
  var flags = "g";
  if (options.literal) 
    query = ignorer.escapeRegExp(query);
  if (options.ignoreCase)
    flags += "i";

  if (options.wordRegexp)
    query = "\\b(?:" + query + ")\\b";

  options.query = new RegExp(query, flags);

  if (replacement) {
    options.replacement = replacement;
  }

  options.queryClean = new RegExp(query, flags.substr(1));
}
}
