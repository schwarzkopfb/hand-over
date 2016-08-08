'use strict'

if (require.main === module)
    return require('tap').pass()

module.exports = MyOtherPlugin

var inherits = require('util').inherits,
    Plugin   = require('./plugin')

function MyOtherPlugin(opts) {
    Plugin.call(this, 'other_test', { test: 42 }, opts)
}

inherits(MyOtherPlugin, Plugin)
