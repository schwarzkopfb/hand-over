'use strict'

if (require.main === module)
    return require('tap').pass()

module.exports = TestPlugin

var inherits = require('util').inherits,
    Plugin   = require('../plugin')

function compareObjects(a, b) {
    if (!a || typeof a !== 'object')
        throw new TypeError('object expected')

    if (!b || typeof b !== 'object')
        throw new TypeError('object expected')

    Object.keys(a).forEach(function (key) {
        if (!(key in b))
            throw new TypeError("'" + key + '\' is expected but not present')
        else if (a[ key ] != b[ key ])
            throw new TypeError("'" + key + '\' does hold a different value than expected')
    })
    Object.keys(b).forEach(function (key) {
        if (!(key in a))
            throw new TypeError("'" + key + '\' is expected but not present')
        else if (a[ key ] != b[ key ])
            throw new TypeError("'" + key + '\' does hold a different value than expected')
    })
}

function TestPlugin(name, expectedOpts, opts) {
    Plugin.call(this, opts)
    this.name = name

    if (!opts || typeof opts !== 'object')
        throw new TypeError('no options object passed')

    if (expectedOpts)
        compareObjects(expectedOpts, opts)
}

inherits(TestPlugin, Plugin)

TestPlugin.prototype.send = function (to, data, callback) {
    callback()
}

TestPlugin.prototype.destroy = function () {
}

// used for error delegation testing
TestPlugin.prototype.emitError = function (err) {
    this.emit('error', err)
}
