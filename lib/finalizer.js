var fs = require("fs"),
    mergesort = require("./mergesort");

module.exports = function(options, allPaths, allFiles, printCb, done) {
  if (options.list) {
    var dirKeys = mergesort(Object.keys(allPaths)), results = "", parent = "";

    for (var d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      results += mergesort(parent).join("\n") + "\n";
    }

    printCb(results);
  }
  else {
    for (var m = 0, allFilesLength = allFiles.length; m < allFilesLength; m++) {
      var path = allFiles[m],
          contents = fs.readFileSync(path, "utf8");

      options.query.lastIndex = 0;
      // don't bother working if there's not even a match
      if ( options.query.test(contents) ) {
        var oMatchCount = contents.match(options.query).length, 
            matchCount = oMatchCount, 
            lines = "";

        if (options.replacement) {
          var replacedContents = contents.replace(options.query, options.replacement);
          fs.writeFile(path, replacedContents, "utf8");
        }

        var contents = contents.split("\n");

        for (var i = 0, strLength = contents.length; matchCount && i < strLength; i++) {
          options.query.lastIndex = 0; // query is set with "g" so this resets the position
          if (options.query.test(contents[i])) {
            var matchLine = (options.replacement ? contents[i].replace(options.query, options.replacement) : contents[i]);
            
            if (!options.ackmate)
              lines += "\t" + (i+1) + ": " + matchLine + "\n"; 
            else { // slow due to match()
              var result = options.queryClean.exec(matchLine);//matchLine.match(options.queryClean);
              lines += (i+1) + ";" + result.index + " " + result[0].length + ": " + matchLine + "\n"; 
            }
            matchCount--;            
          }
        }

        path = options.ackmate ? ":" + path : path + ":";
        
        printCb(path, lines, oMatchCount);
      }
    }

    done();
  }
}