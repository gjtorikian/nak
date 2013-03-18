// filched mostly from https://github.com/andreyvit/pathspec.js
// given the ignore rules, creates an array of regexps to test files against

var RelPathList = require('pathspec').RelPathList;

function Ignorer(exclusions, length) {
  makeRegExp = function(wildcard) {
    // if the rule has an asterisk, escape the segment and swap * for .?
    return new RegExp(escapeRegExp(wildcard).replace(/\\\*/g, ".?"));
  };

  var fnmatch_chars = /!|\*|\?|\[|\]|\0/;

  var r = 0, list = []
  while (r < length) {
    list.push(exclusions[r++]);
    // if (fnmatch_chars.test(exclusions[r])) {
    //   this.regexpIgnores.push(exclusions[r++])
    // }
    // else {
    //   this.literalIgnores.push(exclusions[r++])
    // }
  }

  // this.regexpIgnoresLength = this.regexpIgnores.length;
  // this.literalIgnoresLength = this.literalIgnores.length;

  this.list = RelPathList.parse(list);
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

//Copyright 2009 Nicholas C. Zakas. All rights reserved.
//MIT-Licensed, see source file
function binarySearch(items, value){

  var startIndex  = 0,
      stopIndex   = items.length - 1,
      middle      = Math.floor((stopIndex + startIndex)/2);

  while(items[middle] != value && startIndex < stopIndex){

      //adjust search area
      if (value < items[middle]){
          stopIndex = middle - 1;
      } else if (value > items[middle]){
          startIndex = middle + 1;
      }

      //recalculate middle
      middle = Math.floor((stopIndex + startIndex)/2);
  }

  //make sure it's the right value
  return (items[middle] != value) ? -1 : middle;
}

module.exports = Ignorer;