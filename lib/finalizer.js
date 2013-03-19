var fs = require("fs"),
    mergesort = require("./mergesort"),
    isBinaryFile = require("isbinaryfile");

module.exports = function(options, allPaths, allStats, printCb, done) {
  var dirKeys = mergesort(Object.keys(allPaths)), parent = "";

  if (options.list) {
    var results = "";
    for (var d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      var sort = mergesort(parent);
      if (sort.length)
        results += sort.join("\n") + "\n";
    }

    printCb(results);
  }
  else {
    var allFiles = [];

    for (var d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      allFiles = mergesort(parent);

      for (var m = 0, allFilesLength = allFiles.length; m < allFilesLength; m++) {
        var path = allFiles[m],
            fd = fs.openSync(path, 'r'),
            binaryBuffer = new Buffer(512);
            fs.readSync(fd, binaryBuffer, 0, 512, 0);
            fs.closeSync(fd);

        if (!isBinaryFile(binaryBuffer, allStats[path].size)) {
          contents = fs.readFileSync(path, "utf8");

          if (options.queryClean.test(contents)) {
            var strContents = contents.toString(),
                contentsSplit = strContents.split("\n"),
                lines = "",
                totalMatches = strContents.match(options.query).length, 
                matchCount = totalMatches;

            if (options.replacement) {
              var replacedContents = strContents.replace(options.query, options.replacement);
              fs.writeFile(path, replacedContents, "utf8");
            }

            for (var i = 0, strLength = contentsSplit.length; matchCount && i < strLength; i++) {
              if (options.queryClean.test(contentsSplit[i])) {
                var matchLine = (options.replacement ? contentsSplit[i].replace(options.query, options.replacement) : contentsSplit[i]);
                
                if (!options.ackmate) {
                  lines += "\t" + (i+1) + ": " + matchLine + "\n"; 
                }
                else { // slow due to match()
                  var result = options.queryClean.exec(matchLine);
                  lines += (i+1) + ";" + result.index + " " + result[0].length + ": " + matchLine + "\n"; 
                }

                matchCount--;            
              }
            }
            
            printCb(options.ackmate ? ":" + path : path + ":", lines, totalMatches);
          }
        }
      }
    }
    done();
  }
}