'use strict'

if (require.main === module)
    return require('tap').pass()

module.exports = MyOtherPlugin

var inherits = require('util').inherits,
    Plugin   = require('../plugin')

function MyOtherPlugin(opts) {
    Plugin.call(this, opts)

    if (!opts || typeof opts !== 'object')
        throw new TypeError('no options object passed')
    else if (!opts.test)
        throw new TypeError('invalid options object passed')
}

inherits(MyOtherPlugin, Plugin)

MyOtherPlugin.prototype.name = 'other_test'

MyOtherPlugin.prototype.send = function (to, data, callback) {
    callback()
}
