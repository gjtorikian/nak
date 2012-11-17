// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against
// this could probably be more OOP-y
exports.makeRules = function(exclusions, exclusionsLength) {
  var rules = [], r = 0,

  makeRegExp = function(wildcard) {
    // if the rule has an asterisk, break it up and escape each segment
    return /\*/.test(wildcard) ? new RegExp('^' + ((function() {
      var parts = wildcard.split('*');
      var i, len, results = [];
      for (i = 0, len = parts.length; i < len; i++) {
        results.push(escapeRegExp(parts[i]));
      }
      return results;
    })()).join('.*?') + '$') : new RegExp("^" + escapeRegExp(wildcard) + "$");
  }

  while (r < exclusionsLength) {
    rules.push(makeRegExp(exclusions[r++]));
  }

  return rules;
},

isIgnored = exports.isIgnored = function(exclusions, exclusionsLength, path, showHidden) {
  if (!showHidden && (/^\.\w/.test(path) || /\/\.\w/.test(path))) {
    return true;
  }

  //if (exclusionsLength > 0) {
    for (var r = 0; r < exclusionsLength; r++) {
      if ( (exclusions[r].test(path)) ) {
        return true;
      }
    }
  //}

  return false;
},

escapeRegExp = exports.escapeRegExp = function(str) {
  return str.replace(/([\/'*+?|()\[\]{}.^$])/g, '\\$1');
},

makeWildcardRegExp = exports.makeWildcardRegExp = function(str, fullConversion) {
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