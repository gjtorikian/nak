exports.parseOutput = function(err, stdout, stderr) {
  if (err || stderr) {
    console.error(err);
    console.error(stderr);
  }

  var lines = stdout.split("\n");
  var msgLine = lines[lines.length - 2].split(" ");

  return {
    lines: lines,
    msgLine: msgLine,
    count: msgLine[1],
    filecount: msgLine[4]
  };
};
