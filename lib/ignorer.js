// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

var RelPathList = require('./relpathlist');
var Minimatch = require("minimatch").Minimatch;

function Ignorer(exclusions) {
  var fnmatch_chars = /!|\*|\?|\[|\]|\0/;

  var r = 0, list = []
  while (r < length) {
    if (fnmatch_chars.test(exclusions[r])) {
      this.regexpIgnores.push(exclusions[r++])
    }
    else {
      var mm = new Minimatch(pattern, options)
      this.literalIgnores.push(exclusions[r++])
    }
  }

  // this.regexpIgnoresLength = this.regexpIgnores.length;
  // this.literalIgnoresLength = this.literalIgnores.length;

  this.list = RelPathList.parse(exclusions);
}

Ignorer.prototype.isFileIgnored = function(name, path, showHidden) {
  if (!showHidden && (/^\.\w/.test(name))) {
    return true;
  }
  
  //console.log("fil " + " " + name + " " + path);
  return this.list.matches(path);
}

Ignorer.prototype.isDirIgnored = function(name, path, showHidden) {
  if (!showHidden && (/\/\.\w/.test(path))) {
    return true;
  }
  //console.log("dir " + " " + name + " " + path);
  return this.list.matches(path);
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

module.exports = Ignorer;