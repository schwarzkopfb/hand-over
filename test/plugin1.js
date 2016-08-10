'use strict'

if (require.main === module)
    return require('tap').pass()

module.exports = MyPlugin

var inherits = require('util').inherits,
    Plugin   = require('./plugin'),
    counter  = 0

function MyPlugin(opts) {
    Plugin.call(this, 'test' + counter++, null, opts)
}

inherits(MyPlugin, Plugin)
