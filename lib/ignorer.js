// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

var ignorer = {};

module.exports = ignorer;
var makeRules = ignorer.makeRules = function(exclusions, exclusionsLength) {
  var rules = [], r = 0,

  makeRegExp = function(wildcard) {
    // if the rule has an asterisk, escape the segment and swap * for .?
    return new RegExp(escapeRegExp(wildcard).replace(/\\\*/g, ".?"));
  }

  while (r < exclusionsLength) {
    rules.push(makeRegExp(exclusions[r++]));
  }

  return rules;
},

isIgnored = ignorer.isIgnored = function(exclusions, exclusionsLength, path, showHidden) {
  if (!showHidden && (/^\.\w/.test(path) || /\/\.\w/.test(path))) {
    return true;
  }
  
  var r = 0;
  while (r < exclusionsLength) {
    if ( exclusions[r++].test(path) ) return true;
  }

  return false;
},

escapeRegExp = ignorer.escapeRegExp = function(str) {
  return str.replace(/([\/'*+?|()\[\]{}.^$])/g, '\\$1');
},

makeWildcardRegExp = ignorer.makeWildcardRegExp = function(str, fullConversion) {
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