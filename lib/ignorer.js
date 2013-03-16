// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

function Ignorer(exclusions, length) {
  makeRegExp = function(wildcard) {
    // if the rule has an asterisk, escape the segment and swap * for .?
    return new RegExp(escapeRegExp(wildcard).replace(/\\\*/g, ".?"));
  };

  var fnmatch_chars = /!|\*|\?|\[|\]|\0/;

  var r = 0;
  this.regexpIgnores = [];
  this.literalIgnores = [];
  while (r < length) {
    if (fnmatch_chars.test(exclusions[r])) {
      this.regexpIgnores.push(exclusions[r++])
    }
    else {
      this.literalIgnores.push(exclusions[r++])
    }
  }

  this.regexpIgnoresLength = this.regexpIgnores.length;
  this.literalIgnoresLength = this.rliteralIgnores.length;
}

Ignorer.prototype.isFileIgnored = function(file, path, showHidden) {
  if (!showHidden && (/^\.\w/.test(file))) {
    return true;
  }
    
  return this.searchRulesFn(path);
}

Ignorer.prototype.isDirIgnored = function(path, showHidden) {
  if (!showHidden && (/\/\.\w/.test(path))) {
    return true;
  }
    
  return this.searchRulesFn(path);
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

var binarySearch = function() {
  var low = 0, high = this.length - 1,
      i, comparison;
  while (low <= high) {
    i = Math.floor((low + high) / 2);
    if (this[i] < find) { low = i + 1; continue; };
    if (this[i] > find) { high = i - 1; continue; };
    return i;
  }
  return null;
};)
module.exports = Ignorer;