var fs = require("fs"),
    mergesort = require("./mergesort");

module.exports = function(options, allPaths, allContents, printCb, done) {
  var dirKeys = mergesort(Object.keys(allPaths)), parent = "";

  if (options.list) {
    var results = "";
    for (var d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      results += mergesort(parent).join("\n") + "\n";
    }

    printCb(results);
  }
  else {
    var dirKeys = mergesort(Object.keys(allPaths)), allFiles = [], lines = "";
    for (var d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      allFiles = mergesort(parent);

      for (var m = 0, allFilesLength = allFiles.length; m < allFilesLength; m++) {
        var path = allFiles[m],
            contents = allContents[path],

            totalMatches = contents.match(options.query).length, 
            matchCount = totalMatches;

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