"mocha";

var Assert = require("assert");
var Exec = require("child_process").exec;

var basePath = __dirname + "/filelist_fixtures";

var nakPath = "node bin/nak";
//var nakPath = "node build/nak.min";

describe("filelist", function() {
    it("should get filelist, including hidden files and binaries",  function(next) {
       Exec(nakPath + " -l -H -a ../.nakignore " + basePath, function(err, stdout, stderr) {
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
       Exec(nakPath + " -l -H -a ../.nakignore -f " + basePath, function(err, stdout, stderr) {
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
       Exec(nakPath + " -l -a ../.nakignore " + basePath, function(err, stdout, stderr) {
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

    it("ignores symlinks to files/folders that don't exist", function(next) {
      Exec(nakPath + " -f -l -a ../.nakignore -G symlink-to-nowhere.txt " + basePath, function(err, stdout, stderr) {
       if (err || stderr) {
           console.error(err);
           console.error(stderr);
       }
       var files = stdout.split("\n").filter(function(file) { return !!file; }).sort();
       Assert.equal(files.length, 0);

       next();
      });
    });
});
