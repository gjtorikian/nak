"mocha";

var Assert = require("assert");
var Exec = require("child_process").exec;
var Fs = require('fs');

var basePath = __dirname + "/search_fixtures";
var nak = require('../lib/nak');

var nakPath = "node bin/nak";
//var nakPath = "node build/nak.min";

describe("search", function() {
    it("should find matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -i -q 'sriracha' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 8);
        Assert.equal(filecount, 4);
        Assert.equal(lines.length, 16);

        next();
       });
    });

    it("should find matches without regexp, follow ON, case-sensitive OFF and word boundaries OFF",  function(next) {
       Exec(nakPath + " " + "-f -a .nakignore -i -q 'sriracha' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 9);
        Assert.equal(filecount, 5);
        Assert.equal(lines.length, 19);

        next();
       });
    });

    it("should find matches without regexp, case-sensitive ON and word boundaries OFF",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -q 'Messenger' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 2);
        Assert.equal(filecount, 2);
        Assert.equal(lines.length, 8);

        next();
       });
    });

    it("should find matches without regexp, case-sensitive OFF and word boundaries ON",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -q -w 'gastro' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 3);
        Assert.equal(filecount, 3);
        Assert.equal(lines.length, 11);

        next();
       });
    });

    it("should find matches with a regexp, case-sensitive OFF",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -i 'pb.' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 8);
        Assert.equal(filecount, 4);
        Assert.equal(lines.length, 18);

        next();
       });
    });

    it("should find matches with a regexp, case-sensitive ON, including the default .nakignore file, and hidden files",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -H '.+wave' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 17);
        Assert.equal(filecount, 10);
        Assert.equal(lines.length, 39);

        next();
       });
    });

    it("should find matches without case-sensitive regexp, only two file types, and no hidden files (even if they contain the string)",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -G '*.txt, file*.gif' -i 'shorts' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 2);
        Assert.equal(filecount, 2);
        Assert.equal(lines.length, 8);

        next();
       });
    });

    it("should find matches without regexp, excluding txt files and including hidden ones",  function(next) {
       Exec(nakPath + " " + "-a .nakignore --ignore 'file*.txt' 'williamsburg' -H " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 15);
        Assert.equal(filecount, 5);
        Assert.equal(lines.length, 23);

        next();
       });
    });

    it("should report multiple matches in same line using ackmate",  function(next) {
       Exec(nakPath + " " + "-a .nakignore --ackmate 'wolf' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }
        var lines = stdout.split("\n");

        Assert.equal("8;26 4,42 4", lines[4].split(":")[0]);

        next();
       });
    });

    // see: http://me.dt.in.th/page/StringDecoder
    it("should find incomplete thai characters",  function(next) {
       Exec(nakPath + " " + "-a .nakignore 'ร' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }
        var lines = stdout.split("\n");

        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 1);
        Assert.equal(filecount, 1);
        Assert.equal(lines.length, 5);

        next();
       });
    });

    it("should understand what to do with onFilepathSearchFn (as a string)", function(next) {
       var fn = 'if (/file1\.txt/.test(filepath)) return "photo";\nreturn null;';

       Exec(nakPath + " " + "-a .nakignore 'photo' --onFilepathSearchFn '" + fn + "' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");

        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 5);
        Assert.equal(filecount, 3);

        next();
       });
    });

    it("should understand what to do with onFilepathSearchFn (as a process.env var)", function(next) {
       var fn = function(filepath) {
        if (/file1\.txt/.test(filepath)) return "photo";
        return null;
       };

       process.env.nak_onFilepathSearchFn = nak.serialize(fn);

       Exec(nakPath + " " + "-a .nakignore 'photo' " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");

        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 5);
        Assert.equal(filecount, 3);
        next();
       });
    });

    it("should find matches without regexp, in a starting hidden dir",  function(next) {
       Exec(nakPath + " " + "-f -a .nakignore -i -q 'sriracha' " + basePath + "/.root", function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" ");
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 3);
        Assert.equal(filecount, 1);
        Assert.equal(lines.length, 5);

        next();
       });
    });
});
