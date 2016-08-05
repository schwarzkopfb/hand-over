'use strict'

if (require.main === module)
    return require('tap').pass()

module.exports = MyPlugin

var inherits = require('util').inherits,
    Plugin   = require('../plugin')

function MyPlugin(opts) {
    Plugin.call(this, opts)
    this.name = 'test'

    if (!opts || typeof opts !== 'object')
        throw new TypeError('no options object passed')
}

inherits(MyPlugin, Plugin)

MyPlugin.prototype.send = function (to, data, callback) {
    callback()
}

// used for error delegation testing
MyPlugin.prototype.emitError = function (err) {
    this.emit('error', err)
}
