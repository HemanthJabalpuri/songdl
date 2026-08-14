// src/js/libs/promise.js
// Promise polyfill shim - relocated to libs

// Safe environment-agnostic setImmediate lookup (no undef warnings)
var globalScope = typeof window !== 'undefined' ? window : {};
var localSetImmediate = typeof globalScope.setImmediate === 'function' ? globalScope.setImmediate : function(fn) {
    setTimeout(fn, 0);
};

function FallbackPromise(executor) {
    var self = this;
    self.state = 'pending';
    self.value = undefined;
    self.callbacks = [];

    function resolve(val) {
        if (self.state !== 'pending') return;
        if (val && typeof val.then === 'function') {
            val.then(resolve, reject);
            return;
        }
        self.state = 'fulfilled';
        self.value = val;
        self.callbacks.forEach(function(cb) {
            cb.onFulfilled(val);
        });
    }

    function reject(reason) {
        if (self.state !== 'pending') return;
        self.state = 'rejected';
        self.value = reason;
        self.callbacks.forEach(function(cb) {
            cb.onRejected(reason);
        });
    }

    try {
        executor(resolve, reject);
    } catch (e) {
        reject(e);
    }
}

FallbackPromise.prototype.then = function(onFulfilled, onRejected) {
    var self = this;
    return new FallbackPromise(function(resolve, reject) {
        function handle(value) {
            try {
                if (self.state === 'fulfilled') {
                    if (typeof onFulfilled === 'function') {
                        resolve(onFulfilled(value));
                    } else {
                        resolve(value);
                    }
                } else if (self.state === 'rejected') {
                    if (typeof onRejected === 'function') {
                        resolve(onRejected(value));
                    } else {
                        reject(value);
                    }
                }
            } catch (e) {
                reject(e);
            }
        }

        if (self.state === 'pending') {
            self.callbacks.push({onFulfilled: handle, onRejected: handle});
        } else {
            localSetImmediate(function() {
                handle(self.value);
            });
        }
    });
};

FallbackPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};

FallbackPromise.resolve = function(val) {
    return new FallbackPromise(function(resolve) {
        resolve(val);
    });
};

FallbackPromise.reject = function(reason) {
    return new FallbackPromise(function(resolve, reject) {
        reject(reason);
    });
};

FallbackPromise.all = function(promises) {
    return new FallbackPromise(function(resolve, reject) {
        var results = [];
        var completed = 0;
        if (promises.length === 0) return resolve(results);
        promises.forEach(function(p, i) {
            FallbackPromise.resolve(p).then(function(val) {
                results[i] = val;
                completed++;
                if (completed === promises.length) resolve(results);
            }, reject);
        });
    });
};

// Bind to unified wrapper
window.Utils.Promise = window.Promise || FallbackPromise;
