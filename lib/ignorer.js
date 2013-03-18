// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

var MMB = require("./minimatch_two").Minimatch;

function Ignorer(exclusions) {

  var r = 0, list = [], length = exclusions.length;
  this.ignores = [];
  var mmopt = { matchBase: true, dot: true, flipNegate: true };

  while (r < length) {
    exclusions[r] = exclusions[r].trim();
    if (exclusions[r].length === 0 || exclusions[r][0] === '#') {
      r++; continue;
    }

    this.ignores.push(new MMB(exclusions[r++], mmopt));
  }

  this.ignoresLength = this.ignores.length;
}

Ignorer.prototype.isFileIgnored = function(name, filepath, splitPath, showHidden) {
  if (!showHidden && (/^\.\w/.test(name))) {
    return true;
  }

  //console.log("fil " + " " + name + " " + path);

  var r = 0;
  while (r < this.ignoresLength) {
    if (this.ignores[r++].match(name, filepath, splitPath))
      return true;
  }

  return false;
}

Ignorer.prototype.isDirIgnored = function(name, filepath, splitPath, showHidden) {
  if (!showHidden && (/\/\.\w/.test(name))) {
    return true;
  }
  //console.log("dir " + " " + name + " " + filepath);

  var r = 0;
  while (r < this.ignoresLength) {
    if (this.ignores[r++].match(name, filepath, splitPath))
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

module.exports = Ignorer;