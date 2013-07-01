"mocha";

var Assert = require("assert");
var Exec = require("child_process").exec;
var Fs = require('fs');
var Wrench = require('wrench');

var srcPath = __dirname + "/replace_fixtures/source";
var basePath = __dirname + "/replace_fixtures/files";
var nak = require('../lib/nak');

var nakPath = "node bin/nak";
//var nakPath = "node build/nak.min";

// refresh the search files
Wrench.copyDirSyncRecursive(srcPath, basePath, {
    "forceDelete": true,
    "excludeHiddenUnix": false,
    "preserveFiles": false
});

describe("replace", function() {
    it("should replace matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -i -q 'swag' 'drag' " + basePath, function(err, stdout, stderr) {
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
        Assert.equal(stdout.match("swag"), null);
        Assert.equal(stdout.match(/drag/g).length, 3);

        next();
       });
    });

    it("should replace matches with a regexp, case-sensitive OFF",  function(next) {
       Exec(nakPath + " " + "-a .nakignore -i 'pb(.)' '$1umblepb' " + basePath, function(err, stdout, stderr) {
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
        Assert.equal(stdout.match("pbr"), null);
        Assert.equal(stdout.match(/Rumblepb/g).length, 1);

        next();
       });
    });

    it("should report (and replace) multiple matches in same line using ackmate",  function(next) {
       Exec(nakPath + " " + "-a .nakignore --ackmate 'w(olf)' 'al$1'" + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");

        console.log(lines)
//         Assert.equal("8;26 4,42 4", lines[4].split(":")[0]);

        next();
       });
    });
});
