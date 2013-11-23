// used when nak is run from a script
exports.run = function(options) {
  if (!options) {
    options = process.argv;
    options.splice(0, 2);
    
    // from a script
    if (options[0] === "--json") {
      options = JSON.parse(options[1]);
    } 
    // from the bin
    else {
      options = require("../lib/options").parseArgs(options);
      options.path = options.args.pop();
      
      if (options.args.length == 1)
        options.query = options.args.pop();
      else if (options.args.length == 2) {
        options.replacement = options.args.pop();
        options.query = options.args.pop();
      }
    }
  }
  main(options);
};

function main(options) {
var fs = require('fs'),
    path = require('path'),
    walkdir = require('../lib/walkdir').walkdir,
    PathFilter = require('../lib/path-filter');

// arguments
var fpath = path.resolve(options.path),
    replacement = options.replacement,
    query = options.query,
    fileColor = "", textColor = "", matchColor = "",
    matches = 0,
    filecount = 0;


if (options.color) {
  fileColor = '\n\033[36m%s\033[0m';
  textColor = '\033[37;43m\1\033[0;90m';
  matchColor = '\033[90m%s';
}

setInclusions();
setExclusions(fpath);
// console.log(options)

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
    var output = "";

    walkdir(fpath, options, function(file, lines, _matches) {
      stream.emit("data", file + "\n" + lines);
      matches += _matches;
      filecount++;
    }, function() {
      if (!options.ackmate)
        stream.emit("data", "Found " + matches + (matches == 1 ? " match" : " matches") + " in " + filecount + (filecount == 1 ? " file " : " files "));

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
// if we're listing, callback at the very end
else if (options.list || !query) {
  walkdir(fpath, options, function(lines) {
    console.log(lines);
  });
}
else if (query) {
  makeQuery(query, replacement);

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
      console.log("Found " + matches + (matches == 1 ? " match" : " matches") + " in " + filecount + (filecount == 1 ? " file " : " files "));
  });
}

function setInclusions() {
  options.inclusions = [];
  var paths = (options.pathInclude || '').split(',');
  var i = paths.length;
  while (i--)
    options.inclusions.push(paths[i].trim());
}

function setExclusions(fpath) {
  var referencedExclusions = "",
      nakExclusions = "",
      gitExclusions = "";

  // if these ignore files don't exist, don't worry about them
  if (options.pathToNakignore) {
    try {
        referencedExclusions = fs.readFileSync(options.pathToNakignore, "utf-8");
      } catch (e) { }
  }

  try {
    nakExclusions = fs.readFileSync(fpath + path.sep + ".nakignore", "utf8");
  } catch (e) { /* console.log(e) */ }

  if (options.addVCSIgnores) {
    try {
      gitExclusions = fs.readFileSync(fpath + path.sep + ".gitignore", "utf8");
    } catch (e) { /* console.log(e) */ }
  }

  var combinedExclusions = referencedExclusions + "\n" +
                           nakExclusions + "\n" +
                           gitExclusions + "\n" +
                           (options.ignore || "").replace(/,/g, "\n");

  if (combinedExclusions.length) {
    options.exclusions = combinedExclusions.split(/\r?\n/);
  }
}

function makeQuery(query, replacement) {
  var flags = "g";
  if (options.literal)
    query = PathFilter.escapeRegExp(query);
  if (options.ignoreCase)
    flags += "i";

  if (options.wordRegexp)
    query = "\\b(?:" + query + ")\\b";

  options.query = new RegExp(query, flags);

  options.queryClean = new RegExp(query, flags.substr(1));

  if (typeof replacement == "string") {
    options.replacement = replacement;
  }
}

}

var simplefunc = require("simplefunc");

exports.serialize = function(fn) {
  return simplefunc.toJson(fn);
};

exports.deserialize = function(fn) {
  return simplefunc.fromJson(fn);
};
