// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

function Ignorer(exclusions, length) {
  makeRegExp = function(wildcard) {
    // if the rule has an asterisk, escape the segment and swap * for .?
    return new RegExp(escapeRegExp(wildcard).replace(/\\\*/g, ".?"));
  };

  var r = 0, rules = [];
  while (r < length) rules.push(makeRegExp(exclusions[r++]));

  var searchRules = "var r = 0; while (r < " + length + ") { if ( [" + rules + "][r++].test(path) ) return true; } return false;";
  this.searchRulesFn = new Function("path", searchRules);
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

module.exports = Ignorer;