// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against
// this could probably be more OOP-y
exports.makeRules = function(exclusions, exclusionsLength) {
  var rules = [], r = 0,

  makeRegExp = function(wildcard) {
    var parts = wildcard.split('*'), rule = {};

    if (wildcard[wildcard.length-1] == "/") {
      rule.isDir = true;
      wildcard = wildcard.slice(0,-1);
    }

    rule.regexp = /\*/.test(wildcard) ? new RegExp('^' + ((function() {
      var i, len, results = [];
      for (i = 0, len = parts.length; i < len; i++) {
        results.push(escapeRegExp(parts[i]));
      }
      return results;
    })()).join('.*?') + '$') : new RegExp("^" + escapeRegExp(wildcard ) + "$");

    return rule;
  }

  while (r < exclusionsLength) {
    rules.push(makeRegExp(exclusions[r++]));
  }

  return rules;
};

exports.isIgnored = function(exclusions, exclusionsLength, path, isDir, showHidden) {
  var isHidden = /^\.\w/.test(path);

  if (isHidden && !showHidden)
    return true;

  if (exclusionsLength > 0) {
    var r = 0;
    for (r; r < exclusionsLength; r++) {
      if ( (exclusions[r]["regexp"].test(path)) ) {
        return true;
      }
    }
  }
  return false;
};

var escapeRegExp = exports.escapeRegExp = function(str) {
  return str.replace(/([\/'*+?|()\[\]{}.^$])/g, '\\$1');
}

exports.makeWildcardRegExp = function(str, fullConversion) {
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
}