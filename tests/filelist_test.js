"mocha";

var Assert = require("assert");
var Exec = require("child_process").exec;

var basePath = __dirname + "/filelist_fixtures";

var nakPath = "node bin/nak";
//var nakPath = "node build/nak.min";

var options1 = [
        "-l",
        "-H",
        "-a ../.nakignore",
        basePath
    ],
    options2 = [
        "-l",
        "-a ../.nakignore",
        basePath
    ],
    options3 = [
      "-l",
      "-H",
      "-a ../.nakignore",
      "-f",
      basePath
    ];

describe("filelist", function() {
    it("should get filelist, including hidden files and binaries",  function(next) {
       Exec(nakPath + " " + options1.join(" "), function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }
        var files = stdout.split("\n").filter(function(file) { return !!file; }).sort();

        Assert.equal(files.length, 8);
        Assert.equal(files[2], basePath + "/level1/Toasty.gif");
        Assert.equal(files[3], basePath + "/level1/level2/.hidden");
        Assert.equal(files[4], basePath + "/level1/level2/.level3a/.hidden");

        next();
       });
    });

    it("should get filelist, including symlinks, hidden files, and binaries",  function(next) {
       Exec(nakPath + " " + options3.join(" "), function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }
        var files = stdout.split("\n").filter(function(file) { return !!file; }).sort();

        Assert.equal(files.length, 9);
        Assert.equal(files[8], basePath + "/symlink-to-1.txt");

        next();
       });
    });

    it("should get filelist, without hidden files",  function(next) {
       Exec(nakPath + " " + options2.join(" "), function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }
        var files = stdout.split("\n").filter(function(file) { return !!file; }).sort();

        Assert.equal(files[3], basePath + "/level1/level2/level2.rb");
        Assert.equal(files[4], basePath + "/level1/level2/level3/level4/level4.txt");

        next();
       });
    });
});
