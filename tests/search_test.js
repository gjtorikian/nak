"mocha";

var Assert = require("assert");
var Exec = require("child_process").exec;

var basePath = __dirname + "/search_fixtures";

var nakPath = "node bin/nak";
//var nakPath = "node build/nak.min";

var options1 = [
        "-a .nakignore",
        "-i",
        "-q",
        "'sriracha'", 
        basePath
    ],
    options2 = [
        "-a .nakignore",
        "-q",
        "'Messenger'",
        basePath
    ],
    options3 = [
        "-a .nakignore",
        "-q",
        "-w",
        "'gastro'",
        basePath
    ],
    options4 = [
        "-a .nakignore",
        "-i",
        "'pb.'",
        basePath
    ],
    options5 = [
        "-a .nakignore",
        "-H",
        "'.+wave'",
        basePath
    ],
    options6 = [
        "-a .nakignore",
        "-G '*.txt, file*.gif'",
        "-i",
        "'shorts'",
        basePath
    ],
    options7 = [
        "-a .nakignore",
        "--ignore 'file*.txt'",
        "'williamsburg'",
        "-H",
        basePath
    ];
    
describe("search", function() {
    it("should find matches without regexp, case-sensitive OFF and word boundaries OFF",  function(next) {
       Exec(nakPath + " " + options1.join(" "), function(err, stdout, stderr) {
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

    it("should find matches without regexp, case-sensitive ON and word boundaries OFF",  function(next) {
       Exec(nakPath + " " + options2.join(" "), function(err, stdout, stderr) {
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
       Exec(nakPath + " " + options3.join(" "), function(err, stdout, stderr) {
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
       Exec(nakPath + " " + options4.join(" "), function(err, stdout, stderr) {
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
       Exec(nakPath + " " + options5.join(" "), function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" "); 
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 14);
        Assert.equal(filecount, 7);
        Assert.equal(lines.length, 30);

        next();
       });
    });
   
    it("should find matches without case-sensitive regexp, only two file types, and no hidden files (even if they contain the string)",  function(next) {
       Exec(nakPath + " " + options6.join(" "), function(err, stdout, stderr) {
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
       Exec(nakPath + " " + options7.join(" "), function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var lines = stdout.split("\n");
        var msgLine = lines[lines.length - 2].split(" "); 
        var count = msgLine[1];
        var filecount = msgLine[4];

        Assert.equal(count, 14);
        Assert.equal(filecount, 4);
        Assert.equal(lines.length, 20);

        next();
       });
    });
});
