An ack clone written in Node.js. The focus here is on speed and performance, 
rather than trying to 100% mimic all the functionality of ack.

There were two goals set out:

1. Be faster than ack
2. Return matches in order

I've benchmarked in numerous places where
and why code is written as it is, as well as possible areas of improvement. It's
mostly asynchronous, though due to the requirement of returning items in order,
performs a mergesort at the end of all the results obtained.

As long as it's faster than ack, I'm pleased.

# Behavior

A lot of the functionality is modeled around ag. In fact, you can provide an _.nakignore_ file to define patterns to ignore. _.nakignore_ files in the directory you're searching under are automatically included as ignore rules, but you can choose to specify an additional file with `-p`.

## Enter Nak

After reading Felix's [Faster than C](https://github.com/felixge/faster-than-c) notes, I became inspired to just write a *fast* ack clone, in Node.js.

Previously, TJ had [written an ack clone in Node](https://github.com/visionmedia/search), but his code was not very performant. At least, it was slower than ack.

I benchmarked and rewrote and learned a lot. I created [nak](https://github.com/c9/nak) which, while not supporting _everything_ ack does, does nearly everything ag does, at least, and 100% supports everything we need for Cloud9.

## Benchmarks

You like numbers? Me too. They're fun.

Here's the average time for grabbing the filelist in cloud9infra five times (about 33,761 files). The commands do the exact same thing (get hidden files, _e.t.c._) _and_ exclude the same nonsense directories ( _.git_, _.c9revisions_, `sm` backups, _e.t.c._). :

`ag`     | `nak`    | `ack`    | `find`
---------|----------|----------|---------
0m0.184s | 0m0.940s | 0m1.103s | 0m1.093s

Here are benchmarks for finding the phrase "va" in cloud9infra:

`ag`     | `nak`    | `ack`     | `grep`
---------|----------|-----------|---------
0m2.599s | 0m20.021s| 0m29.876s | 0m20.891s


What ends up happening is that, with ag, the filelist comes up _before the IDE even finishes initializing_. Similarly, search results return _before the panel finishes animating up_. It's some impressive shit.

# Benchmarks

Here's the average time for grabbing the filelist in the core cloud9 core five times (about 33,761 files). The commands do the exact same thing (get hidden files, _e.t.c._) _and_ exclude the same nonsense directories (_.git_, _.c9revisions_, `sm` backups, _e.t.c._). :

ag       | nak      | ack      | find
---------|----------|----------|---------
0m0.184s | 0m0.940s | 0m1.103s | 0m1.093s

Here are benchmarks for finding the phrase "va" in core cloud9:

ag       | nak      | ack       | grep
---------|----------|-----------|---------
0m2.599s | 0m20.021s| 0m29.876s | 0m20.891s


# Testing

All tests (and comparissons to ag) can be found here:

<https://github.com/ajaxorg/cloud9/tree/master/plugins-server/cloud9.ide.filelist>

<https://github.com/ajaxorg/cloud9/tree/master/plugins-server/cloud9.ide.search>

# History

For a discussion on this tool versus ag, find, and grep, see [this pull request](https://github.com/ajaxorg/cloud9/pull/2369) into Cloud9.