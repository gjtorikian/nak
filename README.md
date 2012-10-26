An ack clone written in Node.js. The focus here is on speed and performance, 
rather than trying to 100% mimic all the functionality of ack.

There were two goals set out:

1. Be faster than ack
2. Return matches in order

I've benchmarked in numerous places where
and why code is written as it is, as well as possible areas of improvement. 

At which point I deffered to goal #1: as
long as it's faster than ack, I'm pleased.

# Benchmarks

And fast it is. I ran this against the [Cloud9 core](http://www.github.com/ajaxorg/cloud9) directory, some 33,000 files.