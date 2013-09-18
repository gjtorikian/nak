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

var parseOutput = require("./test_helpers").parseOutput;

// refresh the search files
Wrench.copyDirSyncRecursive(srcPath, basePath, {
    "forceDelete": true,
    "excludeHiddenUnix": false,
    "preserveFiles": false
});

describe("replace", function() {
    it("should replace matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
       Exec(nakPath + " -a .nakignore -i -q 'swag' 'drag' " + basePath, function(err, stdout, stderr) {
        var output = parseOutput(err, stdout, stderr);

        var lines = output.lines;

        Assert.equal(output.count, 3);
        Assert.equal(output.filecount, 3);
        Assert.equal(lines.length, 11);
        Assert.equal(stdout.match("swag"), null);
        Assert.equal(stdout.match(/drag/g).length, 3);

        next();
       });
    });

    it("should replace matches with a regexp, case-sensitive OFF",  function(next) {
       Exec(nakPath + " -a .nakignore -i 'pb(.)' '$1umblepb' " + basePath, function(err, stdout, stderr) {
        var output = parseOutput(err, stdout, stderr);

        var lines = output.lines;

        Assert.equal(output.count, 1);
        Assert.equal(output.filecount, 1);
        Assert.equal(lines.length, 5);
        Assert.equal(stdout.match("pbr"), null);
        Assert.equal(stdout.match(/Rumblepb/g).length, 1);

        next();
       });
    });

    it("should report (and replace) multiple matches in same line using ackmate",  function(next) {
       Exec(nakPath + " -a .nakignore --ackmate 'w(o..)' 'al$1us' " + basePath, function(err, stdout, stderr) {
        var output = parseOutput(err, stdout, stderr);

        var lines = output.lines;

        Assert.equal("1;130 4", lines[1].split(":")[0]);
        Assert.equal("8;26 4,42 4", lines[4].split(":")[0]);

        next();
       });
    });

    it("should replace with an assumed non-regexp",  function(next) {
      Exec(nakPath + " -q -a .nakignore 'emit(\"delete' 'emit(\"remove' " + basePath, function(err, stdout, stderr) {
        var output = parseOutput(err, stdout, stderr);

        var lines = output.lines;

        Assert.equal(output.count, 1);
        Assert.equal(output.filecount, 1);
        Assert.equal(lines.length, 5);
        Assert.equal(stdout.match('self.emit\\("delete"'), null);
        Assert.equal(stdout.match('self.emit\\("remove"').length, 1);

        next();
       });
    });

    it("should use regexp to replace with an assumed non-regexp, but still understand $1",  function(next) {
      Exec(nakPath + " -a .nakignore 'emit\\(\"dede(le.)e' 'emit(\"$1mego' " + basePath, function(err, stdout, stderr) {
        var output = parseOutput(err, stdout, stderr);

        var lines = output.lines;

        Assert.equal(output.count, 1);
        Assert.equal(output.filecount, 1);
        Assert.equal(lines.length, 5);
        Assert.equal(stdout.match('self.emit\\("delete"'), null);
        Assert.equal(stdout.match('self.emit\\("letmego"').length, 1);

        next();
       });
    });
});
