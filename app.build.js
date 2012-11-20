// from https://github.com/posabsolute/small-build-script-with-node

var FILE_ENCODING = 'utf-8';

var fs = require('fs');

function concat(opts) {

	var fileList = opts.src;
	var destPath = opts.dest;

	var out = fileList.map(function(filePath){
		return fs.readFileSync(filePath, FILE_ENCODING);
	});

	out = out.join("\n");

	out = out.replace(/require\(.+\/?options[\"\']\)/, "parser")
			 .replace(/require\(.+\/?walkdir[\"\']\)/, "walker")
			 .replace(/require\(.+\/?async[\"\']\)/, "async")
			 .replace(/require\(.+\/?ignorer[\"\']\)/, "ignorer")
			 .replace(/require\(.+\/?isbinaryfile[\"\']\)/, "isbinaryfile")
			 .replace("module.exports = function(bytes, size) {", "isbinaryfile = function(bytes, size) {")
			 .replace("#!/usr/bin/env node", "");

	fs.writeFileSync(destPath, out, FILE_ENCODING);
	//console.log(' '+ destPath +' built.');
	return out;
}

var concatedFiles = concat({
	src : ["node_modules/isbinaryfile/index.js", "lib/async.js", "lib/ignorer.js", "lib/options.js", "lib/walkdir.js", "bin/nak"],
	dest : 'build/nak.concat.js'
});

function uglify(src, destPath) {
	 var
		uglyfyJS = require('uglify-js'),
		jsp = uglyfyJS.parser,
		pro = uglyfyJS.uglify,
		ast = jsp.parse( src );

	 ast = pro.ast_mangle(ast);
	 ast = pro.ast_squeeze(ast);

	 fs.writeFileSync(destPath, pro.gen_code(ast), FILE_ENCODING);
	 console.log(' '+ destPath +' built.');
}

uglify(concatedFiles, 'build/nak.min.js');

console.log("and we're done");