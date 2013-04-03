"mocha";

var Assert = require("assert");
var Exec = require("child_process").exec;

var basePath = __dirname + "/sorting_fixtures";

var nakPath = "node bin/nak";
//var nakPath = "node build/nak.min";

var options = [
        "-a ../.nakignore",
        "-l", 
        basePath
    ];
    
describe("search", function() {
    it("should return directory results properly",  function(next) {
       Exec(nakPath + " -a ../.nakignore -l " + basePath, function(err, stdout, stderr) {
        if (err || stderr) {
            console.error(err);
            console.error(stderr);
        }

        var fpath = options[2];
        var lines = stdout.split("\n");

        var expected = "a.txt\n" +
                       "b.txt\n" +
                       "p.txt\n" +
                       "README.md\n" +
                       "t.json\n" +
                       "æ.txt\n" +
                       "n_folder/BBB.txt\n" +
                       "n_folder/z.txt\n" +
                       "n_folder/ZZZ.txt\n" +
                       "n_folder/www/a.txt\n" +
                       "p_folder/a.txt\n" +
                       "p_folder/c.txt\n" +
                       "p_folder/b_folder/l.txt\n" + '\n' + ''; // gotta do something about this...

        Assert.equal(lines.length, 15);
        Assert.equal(stdout.replace(new RegExp(fpath + "/", "g"), ""), expected);

        next();
       });
    });
});
