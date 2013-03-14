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

      if ( options.queryClean.test(contents) ) {
        var totalMatches = contents.match(options.query).length, 
            matchCount = totalMatches, 
            lines = "";

        if (options.replacement) {
          var replacedContents = contents.replace(options.query, options.replacement);
          fs.writeFile(path, replacedContents, "utf8");
        }

        var contents = contents.split("\n");

        for (var i = 0, strLength = contents.length; matchCount && i < strLength; i++) {
          if (options.queryClean.test(contents[i])) {
            var matchLine = (options.replacement ? contents[i].replace(options.query, options.replacement) : contents[i]);
            
            if (!options.ackmate)
              lines += "\t" + (i+1) + ": " + matchLine + "\n"; 
            else { // slow due to match()
              var result = options.queryClean.exec(matchLine);
              lines += (i+1) + ";" + result.index + " " + result[0].length + ": " + matchLine + "\n"; 
            }
            matchCount--;            
          }
        }

        path = options.ackmate ? ":" + path : path + ":";
        
        printCb(path, lines, totalMatches);
      }
    }

    done();
  }
}