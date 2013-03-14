An `ack`/`ag` clone written in Node.js. The focus here is on speed and performance, 
rather than trying to 100% mimic all the functionality of `ack`.

There were two goals set out:

1. Be faster than `ack`
2. Return matches in order

I've benchmarked in numerous places where
and why code is written as it is, as well as possible areas of improvement. It's
mostly asynchronous, though due to the requirement of returning items in order,
performs a mergesort at the end of all the results obtained.

As long as it's faster than `ack`, I'm pleased.

# Behavior

A lot of the functionality is modeled around `ag`. In fact, you can provide a _.nakignore_ file to define patterns to ignore. _.nakignore_ files in the directory you're searching under are automatically included as ignore rules, but you can choose to specify any additional file (with _.gitignore_-style rules) with `-a`.

Some missing options include specifying a maxdepth, or following symlinks.

# Usages

`nak -G '*.js' 'function' .`

Find all files ending in `js`, in the current directory,  with the word `function`.

# Why?

After reading Felix's [Faster than C](https://github.com/felixge/faster-than-c) notes, I became inspired to just write a **fast** `ack` clone, in Node.js.

Previously, TJ had [written an `ack` clone in Node](https://github.com/visionmedia/search), but his code was not very performant. At least, it was slower than `ack`.

I benchmarked and rewrote and learned a lot. While `nak` does not support _everything_ `ack` does, it does nearly everything `ag` does, and, at least, 100% supports everything needed for Cloud9.

# Benchmarks

You like numbers? Me too. They're fun.

Here's the average time for grabbing information from a directory with 13,300 files five times. The commands do the exact same thing by just listing all the available files in the directory structure, _and_ try to exclude the same files/directories.

`ag`     | `nak`    | `ack`    | `find`
---------|----------|----------|---------
10.052s  | 4.863s   | 5.217s   | 28.989s

Here are benchmarks for finding the phrase "va" in cloud9infra, as a whole-word regexp, case insensitively:

`ag`     | `nak`    | `ack`     | `grep`
---------|----------|-----------|---------
34.609s  | 29.327s  | 88.883s   | 256.14s

Obviously, part of the speed impediment to `ack` or `grep` is the lack of a _simple_ way to provide ignore rules.

# Testing

All tests can be found in _tests_; they use [`mocha`](http://visionmedia.github.com/mocha/) to run. To run them:

```
npm install mocha -g
npm test
```

# Builds

Building is necessary only if you want a minified version of nak, or, a version that works with [VFS-Local](https://github.com/c9/vfs-local).

Just call `node compile.js` from the root directory to generate a build. You'll need to `npm install uglify-js` first. 

You'll get several files: one is nak minifed, and the other is a minifed version of nak that is suitable for use with VFS. The API and argument consumption for VFS local is the exact same; just make sure you call `api.execute` within the callback for `vfs.extend`.

# Options

```
Options:
        -l|--list                       list files encountered
        -H|--hidden                     search hidden files and directories (default off)
        -c|--color                      adds color to results  (default off)
        -a|--pathToNakignore «value»        path to an additional nakignore file
        -q|--literal                    do not parse PATTERN as a regular expression; match it literally
        -w|--wordRegexp                 only match whole words
        -i|--ignoreCase                 match case insensitively
        -G|--fileSearch «value»       comma-separated list of wildcard files to only search on
        -d|--ignore «value»             comma-separated list of wildcard files to additionally ignore
           --ackmate                    output results in a format parseable by AckMate
```

# History

For a deeper discussion on this tool versus `ag`, `find`, and `grep`, see [this discussion](https://github.com/ajaxorg/cloud9/pull/2369) into Cloud9.