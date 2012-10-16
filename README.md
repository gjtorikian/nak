An ack clone written in Node.js. The focus here is on speed and performance, 
rather than trying to 100% mimic all the functionality of ack.

There were two goals set out:

1. Be faster than ack
2. Return matches in order

Because of #2, a lot of the functionality here is synchronous. While that may seem
like a problem in Node.js land, I've tried to benchmark in numerous places where
and why code is written as it is, as well as possible areas of improvement. The
fact is, you cannot do something as simple as an ordered recursive list of directories
without getting extremely complicated. At which point I deffered to goal #1: as
long as it's faster than ack, I'm pleased.

# Benchmarks

And fast it is. I ran this against the Cloud9 core directory, some 33,755 files.