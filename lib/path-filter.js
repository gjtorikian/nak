var path = require("path");
var Minimatch = require("minimatch").Minimatch;

// filched from 0.2.11; we need to override some stuff to be more optimal
Minimatch.prototype.match = function(f, partial) {
  // console.error("match", f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ""

  if (f === "/" && partial) return true

  var options = this.options

  // windows: need to use /, not \
  // On other platforms, \ is a valid (albeit bad) filename char.
  if (process.platform === "win32") {
    f = f.split("\\").join("/")
  }

  // treat the test path as a set of pathparts.
  f = f.split(/\/+/)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  // console.error(this.pattern, "set", set)

  this.options.matchBase = false;
  // ADDED THIS; otherwise, Minimatch calls the expensive join/split every time
  var splitFile = path.basename(f.join("/")).split("/"), file;

  for (var i = 0, l = set.length; i < l; i ++) {
    var pattern = set[i];
    file = pattern.length === 1 ? splitFile : f;
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      this.options.matchBase = true
      return true
    }
  }

  this.options.matchBase = true
  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  return false
}

// Given sets of patterns, creates arrays of Minimatch objects to test paths.
function PathFilter(inclusions, exclusions, showHidden) {
  this.inclusions = this.createMatchers(inclusions);
  this.exclusions = this.createMatchers(exclusions);

  if (showHidden !== true)
    this.excludeHidden();
}

PathFilter.prototype.isFileAccepted = function(filepath) {
  return this.isPathAccepted('directory', filepath) && this.isPathAccepted('file', filepath);
};

PathFilter.prototype.isDirectoryAccepted = function(filepath) {
  return this.isPathAccepted('directory', filepath);
};

PathFilter.prototype.isPathAccepted = function(fileOrDirectory, filepath) {
  return !this.isPathIgnored(fileOrDirectory, filepath) && this.isPathIncluded(fileOrDirectory, filepath);
};

PathFilter.prototype.isPathIgnored = function(fileOrDirectory, filepath) {
  var exclusions = this.exclusions[fileOrDirectory];
  var r = exclusions.length;
  while (r--)
    if (exclusions[r].match(filepath))
      return true;

  return false;
};

PathFilter.prototype.isPathIncluded = function(fileOrDirectory, filepath) {
  var inclusions = this.inclusions[fileOrDirectory];
  var r = inclusions.length;

  if (!r)
    return true;

  while (r--)
    if (inclusions[r].match(filepath))
      return true;

  return false;
}

PathFilter.prototype.excludeHidden = function() {
  var matcher = new Minimatch(".*", PathFilter.MINIMATCH_OPTIONS)
  this.exclusions.file.push(matcher);
  this.exclusions.directory.push(matcher);
}

PathFilter.prototype.createMatchers = function(patterns) {
  function addFileMatcher(matchers, pattern) {
    matchers.file.push(new Minimatch(pattern, PathFilter.MINIMATCH_OPTIONS));
  }

  function addDirectoryMatcher(matchers, pattern) {
    // It is important that we keep two permutations of directory patterns:
    //
    // * 'directory/anotherdir'
    // * 'directory/anotherdir/*'
    //
    // Minimatch will return false if we were to match 'directory/anotherdir'
    // against pattern 'directory/anotherdir/*'. And it will return false
    // matching 'directory/anotherdir/file.txt' against pattern
    // 'directory/anotherdir'.
    if (pattern[pattern.length - 1] === '/')
      pattern += '*';

    if (/\/\*$/.test(pattern))
      addDirectoryMatcher(matchers, pattern.slice(0, pattern.length-2));

    matchers.directory.push(new Minimatch(pattern, PathFilter.MINIMATCH_OPTIONS));
  }

  var r = patterns.length,
      pattern = null,
      matchers = {
        file: [],
        directory: []
      };

  while (r--) {
    pattern = patterns[r].trim();
    if (pattern.length === 0 || pattern[0] === '#')
      continue;

    if (/\/$|\/\*$/.test(pattern))
      addDirectoryMatcher(matchers, pattern);
    else if (pattern.indexOf('.') < 0 && pattern.indexOf('*') < 0)
      addDirectoryMatcher(matchers, pattern + '/*');
    else
      addFileMatcher(matchers, pattern);
  }

  return matchers;
}

PathFilter.MINIMATCH_OPTIONS = { matchBase: true, dot: true, flipNegate: true };

PathFilter.escapeRegExp = function(str) {
  return str.replace(/([\/'*+?|()\[\]{}.\^$])/g, '\\$1');
};

module.exports = PathFilter;
