var fs = require("fs"),
    mergesort = require("./mergesort"),
    isBinaryFile = require("isbinaryfile"),
    StringDecoder = require('string_decoder').StringDecoder,
    decoder = new StringDecoder('utf8');

module.exports = function(options, allPaths, allFiles, printCb, done) {
  if (options.list) {
    if (options.json) {
      printCb(allPaths);
    }
    else {
      var dirKeys = mergesort(Object.keys(allPaths)), results = "", parent = "";

      for (var d = 0, dLength = dirKeys.length; d < dLength; d++) {
        parent = allPaths[dirKeys[d]];
        results += mergesort(parent).join("\n") + "\n";
      }

      printCb(results);
    }
  }
  else {
    var matchedFiles = mergesort(Object.keys(allFiles));

    for (var m = 0, allFilesLength = matchedFiles.length; m < allFilesLength; m++) {
      var path = matchedFiles[m],
          fileBuffer = fs.readFileSync(path);

      if (options.json) {
        var jsonResult = {};
        jsonResult[path] = {};
      }

      var contents = decoder.write(fileBuffer);

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
            if (options.json) {
              jsonResult[path][i + 1] = matchLine;
            }
            else {
              lines += "\t" + (i+1) + ": " + matchLine + "\n"; 
            }
            matchCount--;            
          }
        }

        if (options.json) {
          console.log((jsonResult));
        }
        else {
          printCb(path, lines, oMatchCount, matchedFiles);
        }
      }
    }

    done();
  }
}