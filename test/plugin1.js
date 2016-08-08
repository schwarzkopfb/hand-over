'use strict'

if (require.main === module)
    return require('tap').pass()

module.exports = MyPlugin

var inherits = require('util').inherits,
    Plugin   = require('./plugin')

function MyPlugin(opts) {
    Plugin.call(this, 'test', null, opts)
}

inherits(MyPlugin, Plugin)
