'use strict'

module.exports = MyOtherPlugin

var inherits = require('util').inherits,
    Plugin   = require('../plugin')

function MyOtherPlugin(options) {
    Plugin.call(this)

    this.name    = 'other_test'
    this.version = '0.0.1'
    this.options = options
}

inherits(MyOtherPlugin, Plugin)

MyOtherPlugin.prototype.send = function (to, data, callback) {
    console.log('plugin2:', to, data)
    callback()
}
