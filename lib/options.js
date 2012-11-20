// from https://gist.github.com/982499/e3c124da72796694a3bc08ed6e22d51b447d2575#file_options.js
/** Command-line options parser (http://valeriu.palos.ro/1026/).
    Copyright 2011 Valeriu Paloş (valeriu@palos.ro). All rights reserved.
    Released as Public Domain.

    Expects the "schema" array with options definitions and produces the
    "options" object and the "arguments" array, which will contain all
    non-option arguments encountered (including the script name and such).

    Syntax:
        [«short», «long», «attributes», «brief», «callback»]

    Attributes:
        ! - option is mandatory;
        : - option expects a parameter;
        + - option may be specified multiple times (repeatable).

    Notes:
        - Parser is case-sensitive.
        - The '-h|--help' option is provided implicitly.
        - Parsed options are placed as fields in the "options" object.
        - Non-option arguments are placed in the "arguments" array.
        - Options and their parameters must be separated by space.
        - Either one of «short» or «long» must always be provided.
        - The «callback» function is optional.
        - Cumulated short options are supported (i.e. '-tv').
        - If an error occurs, the process is halted and the help is shown.
        - Repeatable options will be cumulated into arrays.
        - The parser does *not* test for duplicate option definitions.
    */

var parser = {};
module.exports = parser;
// Option definitions.
var schema = [
    ['l', 'list',    '', 'list files encountered'],
    ['H', 'hidden',  '', 'search hidden files and directories (default off)'],
    ['c', 'color',        '',   'adds color to results  (default off)'],
    ['p', 'pathToNakignore',   ':',  'path to an additional nakignore file'],
    ['m', 'maxdepth', ':',  'the maximum depth of the search'],
    ['q', 'literal',  '', 'do not parse PATTERN as a regular expression; match it literally'],
    ['w', 'wordRegexp',        '',   'only match whole words'],
    ['i', 'ignoreCase',   '',  'match case insensitively'],
    ['G', 'fileSearch', ':',  'comma-separated list of wildcard files to only search on'],
    ['d', 'ignore',        ':',   'comma-separated list of wildcard files to additionally ignore'],
    ['p', 'piped',   '',  'indicates filenames are being piped in (like, from ag or find)'],
],

parseArgs = parser.parseArgs = function() {
    // Parse options.
    try {
        if (process.argv.length == 2) {
            throw 'help';
        }

        var tokens = [];
        var options = {};
        options.args = [];
        for (var i = 0, item = process.argv[0]; i < process.argv.length; i++, item = process.argv[i]) {
            if (item.charAt(0) == '-') {
                if (item.charAt(1) == '-') {
                    tokens.push('--', item.slice(2));
                } else {
                    tokens = tokens.concat(item.split('').join('-').split('').slice(1));
                }
            } else {
                tokens.push(item);
            }
        }
        while (type = tokens.shift()) {
            if (type == '-' || type == '--') {
                var name = tokens.shift();
                if (name == 'help' || name == 'h') {
                    throw 'help';
                    continue;
                }
                var option = null;
                for (var i = 0, item = schema[0]; i < schema.length; i++, item = schema[i]) {
                    if (item[type.length - 1] == name) {
                        option = item;
                        break;
                    }
                }
                if (!option) {
                    throw "Unknown option '" + type + name + "' encountered!";
                }
                var value = true;
                if ((option[2].indexOf(':') != -1) && !(value = tokens.shift())) {
                    throw "Option '" + type + name + "' expects a parameter!";
                }
                var index = option[1] || option[0];
                if (option[2].indexOf('+') != -1) {
                    options[index] = options[index] instanceof Array ? options[index] : [];
                    options[index].push(value);
                } else {
                    options[index] = value;
                }
                if (typeof(option[4]) == 'function') {
                    option[4](value);
                }
                option[2] = option[2].replace('!', '');
            } else {
                options.args.push(type);
                continue;
            }
        }
        for (var i = 0, item = schema[0]; i < schema.length; i++, item = schema[i]) {
            if (item[2].indexOf('!') != -1) {
                throw "Option '" + (item[1] ? '--' + item[1] : '-' + item[0]) +
                      "' is mandatory and was not given!";
            }
        }

        options.args.splice(0, 2); // gets rid of the starting "node" and script name
        return options;
    } catch(e) {
        if (e == 'help') {
            console.log("Usage: [options] 'PATTERN' ['REPLACEMENT'] 'PATH' \n");
            console.log("Options:");
            for (var i = 0, item = schema[0]; i < schema.length; i++, item = schema[i]) {
                var names = (item[0] ? '-' + item[0] + (item[1] ? '|' : ''): '   ') +
                            (item[1] ? '--' + item[1] : '');
                var syntax = names + (item[2].indexOf(':') != -1 ? ' «value»' : '');
                syntax += syntax.length < 20 ? new Array(20 - syntax.length).join(' ') : '';
                console.log("\t" + (item[2].indexOf('!') != -1 ? '*' : ' ')
                                 + (item[2].indexOf('+') != -1 ? '+' : ' ')
                                 + syntax + "\t" + item[3]);
            }
            process.exit(0);
        }
        console.error(e);
        console.error("Use  the '-h|--help' option for usage details.");
        process.exit(1);
    }
}