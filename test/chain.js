'use strict'

if (require.main === module)
    return require('tap').pass()

module.exports = execute

// execute the given test chain,
// one per event loop tick
function execute(tests) {
    void function next(i, val) {
        var fn = tests[ i++ ]

        if (fn)
            process.nextTick(next, i, fn(val))
    }(0)
}
