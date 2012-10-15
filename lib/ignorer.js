// filched mostly from https://github.com/andreyvit/pathspec.js
// this could probably be more OOP-y
exports.makeRules = function(exclusions, exclusionsLength) {
  var rules = [], r = 0,

  RegExp_escape = function(str) {
    return str.replace(/([\/'*+?|()\[\]{}.^$])/g, '\\$1');
  },
  makeRegExp = function(wildcard) {
    var parts = wildcard.split('*'), rule = {};

    rule.regexp = /\*/.test(wildcard) ? new RegExp('^' + ((function() {
      var i, len, results = [];
      for (i = 0, len = parts.length; i < len; i++) {
        results.push(RegExp_escape(parts[i]));
      }
      return results;
    })()).join('.*?') + '$') : new RegExp(RegExp_escape(wildcard));

    if (wildcard[wildcard.length-1] == "/")
      rule.isDir = true;

    return rule;
  }

  while (r < exclusionsLength) {
    rules.push(makeRegExp(exclusions[r++]));
  }

  return rules;
};

exports.isIgnored = function(exclusions, exclusionsLength, path, isDir, showHidden) {
  var isHidden = !showHidden && /^\.\w/.test(path);

  if (exclusionsLength > 0) {
    var r = 0;
    for (r; r < exclusionsLength; r++) {
      if ( (exclusions[r]["regexp"].test(path) && (!isDir || (isDir && exclusions[r].isDir))) || isHidden) 
        return true;
    }
  }
  return isHidden;
};