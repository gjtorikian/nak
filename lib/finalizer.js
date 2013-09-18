var fs = require("fs"),
    mergesort = require("./mergesort"),
    isBinaryFile = require("isbinaryfile");

function readPath(options, path, size) {
  var text = null;
  if (options.onFilepathSearchFn && (text = options.onFilepathSearchFn(path)))
    return text;

  var fd = fs.openSync(path, "r");
  try {
    var binaryBuffer = new Buffer(512);
    var bytesRead = fs.readSync(fd, binaryBuffer, 0, 512);

    if (!isBinaryFile(binaryBuffer, bytesRead)) {
      var remainingBytes = size - bytesRead;
      if (remainingBytes > 0) {
        var textBuffer = new Buffer(size);
        binaryBuffer.copy(textBuffer, 0, 0, bytesRead);
        bytesRead += fs.readSync(fd, textBuffer, bytesRead, remainingBytes);
        text = textBuffer.toString("utf8", 0, bytesRead);
      }
      else {
        text = binaryBuffer.toString("utf8", 0, bytesRead);
      }
    }
    return text;
  } finally {
    fs.closeSync(fd);
  }
}


function Finalizer(options, allPaths, allStats, printCb, done) {
  var dirKeys = mergesort(Object.keys(allPaths)), parent = "", d, dLength;

  if (options.list) {
    var results = "";
    for (d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      results += mergesort(parent).join("\n") + "\n";
    }

    printCb(results);
  }
  else {
    var allFiles = [], originalQuery = options.query, originalQueryClean = options.queryClean;

    for (d = 0, dLength = dirKeys.length; d < dLength; d++) {
      parent = allPaths[dirKeys[d]];
      allFiles = mergesort(parent);

      for (var m = 0, allFilesLength = allFiles.length; m < allFilesLength; m++) {
        var filepath = allFiles[m],
            strContents = readPath(options, filepath, allStats[filepath].size);
        if (options.queryClean.test(strContents)) {
          var contentsSplit = strContents.split("\n"),
              lines = "",
              totalMatches = strContents.match(options.query).length,
              matchCount = totalMatches;

            if (options.replacement) {
              var replacedContents = strContents.replace(options.query, options.replacement);
              // TODO: could we be better here?
              fs.writeFileSync(filepath, replacedContents);
            }

            for (var i = 0, strLength = contentsSplit.length; matchCount; i++) {
              var matchLine = contentsSplit[i];
              if (options.queryClean.test(matchLine)) {

                if (options.ackmate)
                  var strPos = [], lastMatchLength;

                // we're offsetting by just checking matchCount in the for conditional
                while ( options.query.test(matchLine) ) {
                  if (options.ackmate) {
                    lastMatchLength = RegExp.lastMatch.length;
                    strPos.push(options.query.lastIndex - lastMatchLength + " " + lastMatchLength);
                  }
                  matchCount--;
                }

                if (options.replacement)
                  matchLine = matchLine.replace(options.query, options.replacement);

                if (options.ackmate)
                  lines += (i+1) + ";" + strPos.join(",") + ":" + matchLine + "\n";
                else
                  lines += "\t" + (i+1) + ": " + matchLine + "\n";

                options.query.lastIndex = 0;
              }
            }

            printCb(options.ackmate ? ":" + filepath : filepath + ":", lines, totalMatches);
          }
      }
    }
    done();
  }
}

module.exports = Finalizer;
