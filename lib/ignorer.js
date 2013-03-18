// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

var RelPathList = require('./relpathlist');
var Minimatch = require("minimatch").Minimatch;

function Ignorer(exclusions) {
  var fnmatch_chars = /!|\*|\?|\[|\]|\0/;

  var r = 0, list = [], length = exclusions.length;
  this.literalIgnores = [];
  this.regexpIgnores = [];
  var mmopt = { matchBase: true, dot: true, flipNegate: true };

  while (r < length) {
    exclusions[r] = exclusions[r].trim();
    if (exclusions[r].length === 0 || exclusions[r][0] === '#') {
      r++; continue;
    }

    if (fnmatch_chars.test(exclusions[r])) {
      this.regexpIgnores.push(new Minimatch(exclusions[r++], mmopt));
    }
    else {
      this.literalIgnores.push(exclusions[r++])
    }
  }

  this.regexpIgnoresLength = this.regexpIgnores.length;
  this.literalIgnoresLength = this.literalIgnores.length;

  console.log(this.literalIgnores)
}

Ignorer.prototype.isFileIgnored = function(parent, name, path, showHidden) {
  if (!showHidden && (/^\.\w/.test(name))) {
    return true;
  }
  
  if (binarySearch(path)) return true;

  var r =0;
  while (r < this.regexpIgnoresLength) {
    if (this.regexpIgnores[r++].matches(path))
      return true;
  }
  return false;
}

Ignorer.prototype.isDirIgnored = function(parent, name, path, showHidden) {
  if (!showHidden && (/\/\.\w/.test(path))) {
    return true;
  }
  
  if (binarySearch(path)) return true;

  var r =0;
  while (r < this.regexpIgnoresLength) {
    if (this.regexpIgnores[r++].matches(path))
      return true;
  }
  return false;
}

Ignorer.makeWildcardRegExp = function(str, fullConversion) {
  if (!str)
    return "";

  // remove all whitespace
  str = str.replace(/\s/g, "");
  str = escapeRegExp(str);

  // convert wildcard norms to regex ones     
  str = str.replace(/\\\*/g, ".*");
  str = str.replace(/\\\?/g, ".");

  if (fullConversion) {
    // we wants pipe seperation, not commas
    // (this is a regexp list with ORs)
    str = str.replace(/,/g, "|");

    str = new RegExp("(?:" + str + ")");

    return str;
  }

  return str;
};

var escapeRegExp = Ignorer.escapeRegExp = function(str) {
  return str.replace(/([\/'*+?|()\[\]{}.^$])/g, '\\$1');
}

var binarySearch = Ignorer.binarySearch = function(find) {
  var low = 0, high = this.literalIgnoresLength - 1,
      i, comparison;
  while (low <= high) {
    i = Math.floor((low + high) / 2);
    if (this.literalIgnores[i] < find) { low = i + 1; continue; };
    if (this.literalIgnores[i] > find) { high = i - 1; continue; };
    return i;
  }
  return null;
};

module.exports = Ignorer;