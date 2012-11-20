// taken from https://github.com/caolan/async

var async = {};

module.exports = async;

async.queue = function (worker, concurrency) {
    var workers = 0;
    var q = {
        tasks: [],
        concurrency: concurrency,
        saturated: null,
        empty: null,
        drain: null,
        push: function (data, callback) {
            if(data.constructor !== Array) {
                data = [data];
            }
            data.forEach(function(task) {
                q.tasks.push({
                    data: task,
                    callback: typeof callback === 'function' ? callback : null
                });
                if (q.saturated && q.tasks.length == concurrency) {
                    q.saturated();
                }
                process.nextTick(q.process);
            });
        },
        process: function () {
            if (workers < q.concurrency && q.tasks.length) {
                var task = q.tasks.shift();
                if(q.empty && q.tasks.length == 0) q.empty();
                workers += 1;
                worker(task.data, function () {
                    workers -= 1;
                    if (task.callback) {
                        task.callback.apply(task, arguments);
                    }
                    if(q.drain && q.tasks.length + workers == 0) q.drain();
                    q.process();
                });
            }
        },
        length: function () {
            return q.tasks.length;
        },
        running: function () {
            return workers;
        }
    };
    return q;
};