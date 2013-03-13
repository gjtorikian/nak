// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

module.exports = (function () {
    var rules = [], exclusions, exclusionsLength;

    var Ignorer = function(exclusions, length) {
      var r = 0, exclusionsLength = length,

      makeRegExp = function(wildcard) {
        // if the rule has an asterisk, escape the segment and swap * for .?
        return new RegExp(escapeRegExp(wildcard).replace(/\\\*/g, ".?"));
      };

      while (r < exclusionsLength) rules.push(makeRegExp(exclusions[r++]));

      this.isIgnored = function(path, showHidden) {
        if (!showHidden && (/^\.\w/.test(path) || /\/\.\w/.test(path))) {
          return true;
        }
        
        var r = 0;
        while (r < exclusionsLength) {
          if ( rules[r++].test(path) ) return true;
        }

        return false;
      }
    };


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

    return Ignorer;
})();