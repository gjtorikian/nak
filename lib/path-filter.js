var Minimatch = require("minimatch").Minimatch;

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
