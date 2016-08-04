'use strict'

module.exports = MyPlugin

var inherits = require('util').inherits,
    Plugin   = require('../plugin')

function MyPlugin(options) {
    Plugin.call(this)

    this.name    = 'test'
    this.version = '0.0.1'
    this.options = options
}

inherits(MyPlugin, Plugin)

MyPlugin.prototype.send = function (to, data, callback) {
    console.log('plugin1:', to, data)
    callback()
}
