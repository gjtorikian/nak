var fs = require("fs"),
    mergesort = require("./mergesort"),
    isBinaryFile = require("isbinaryfile");

function Finalizer(options, allPaths, allStats, printCb, done) {
  var dirKeys = mergesort(Object.keys(allPaths)), parent = "";
  var d, dLength;
  
  if (options.list) {
    var results = "";
    for (d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      results += mergesort(parent).join("\n") + "\n";
    }

    printCb(results);
  }
  else {
    var strContents, allFiles = [];

    for (d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      allFiles = mergesort(parent);

      for (var m = 0, allFilesLength = allFiles.length; m < allFilesLength; m++) {
        var filepath = allFiles[m],
            fd = fs.openSync(filepath, 'r'),
            binaryBuffer = new Buffer(512);
            fs.readSync(fd, binaryBuffer, 0, 512, 0);
            fs.closeSync(fd);

        if (!isBinaryFile(binaryBuffer, allStats[filepath].size)) {
          strContents = fs.readFileSync(filepath, "utf8");

          if (options.queryClean.test(strContents)) {
            var contentsSplit = strContents.split("\n"),
                lines = "",
                totalMatches = strContents.match(options.query).length, 
                matchCount = totalMatches;

              if (options.ackmate)
                var result;

              if (options.replacement) {
                var replacedContents = strContents.replace(options.query, options.replacement);
                fs.writeFile(filepath, replacedContents, "utf8");
              }

              for (var i = 0, strLength = contentsSplit.length; matchCount; i++) {
                var matchLine = contentsSplit[i]
                if (options.queryClean.test(matchLine)) {
                  if (options.replacement)
                    matchLine = matchLine.replace(options.query, options.replacement);

                  if (!options.ackmate) {
                    lines += "\t" + (i+1) + ": " + matchLine + "\n"; 
                  }
                  else { // slower due to exec() 
                    if (options.ackmate)
                      var strPos = [];

                    while ( result = options.query.exec(matchLine) )
                      strPos.push(result.index + " " + result[0].length);

                    lines += (i+1) + ";" + strPos.join(",") + ":" + matchLine + "\n"; 
                  }

                  matchCount--;        
                }
              }
              
              printCb(options.ackmate ? ":" + filepath : filepath + ":", lines, totalMatches);
            }
        }
      }
    }
    done();
  }
}

module.exports = Finalizer;