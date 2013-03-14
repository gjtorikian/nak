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
    var dirKeys = mergesort(Object.keys(allPaths)), allFiles = [];
    for (var d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      allFiles = mergesort(parent);

      for (var m = 0, allFilesLength = allFiles.length; m < allFilesLength; m++) {
        var path = allFiles[m],
            contents = allContents[path],
            contentsSplit = contents.split("\n"),

            lines = "",
            
            totalMatches = contents.match(options.query).length, 
            matchCount = totalMatches;

        if (options.replacement) {
          var replacedContents = contents.replace(options.query, options.replacement);
          fs.writeFile(path, replacedContents, "utf8");
        }

        for (var i = 0, strLength = contentsSplit.length; matchCount && i < strLength; i++) {
          if (options.queryClean.test(contentsSplit[i])) {
            var matchLine = (options.replacement ? contentsSplit[i].replace(options.query, options.replacement) : contentsSplit[i]);
            
            if (!options.ackmate) {
              lines += "\t" + (i+1) + ": " + matchLine + "\n"; 
              path = path + ":";
            }
            else { // slow due to match()
              var result = options.queryClean.exec(matchLine);
              lines += (i+1) + ";" + result.index + " " + result[0].length + ": " + matchLine + "\n"; 
              path = ":" + path;
            }

            matchCount--;            
          }
        }
        
        printCb(path, lines, totalMatches);
      }
    }
    done();
  }
}