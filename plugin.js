'use strict'

module.exports = HandoverPlugin

var assert       = require('assert'),
    inherits     = require('util').inherits,
    EventEmitter = require('events').EventEmitter

function HandoverPlugin(options) {
    EventEmitter.call(this)
    this.options = options || {}
}

inherits(HandoverPlugin, EventEmitter)

Object.defineProperties(HandoverPlugin.prototype, {
    name: {
        enumerable:   true,
        configurable: true,

        get: function () {
            assert.fail('undefined', 'string', 'plugin does not specify its name', '===')
        },

        set: function (value) {
            assert.equal(typeof value, 'string', 'plugin name must be a string')
            assert(value, 'plugin name cannot be empty')

            delete this.name
            Object.defineProperty(this, 'name', {
                enumerable: true,
                value:      value
            })
        }
    },

    send: {
        enumerable:   true,
        configurable: true,

        get: function () {
            assert.fail('undefined', 'function', this.name + ' plugin does not implement `send()`', '===')
        },

        set: function (fn) {
            assert.equal(typeof fn, 'function', '`send` must be a function')
            assert(fn.length >= 2, '`send` must take at least 2 arguments')

            delete this.send
            Object.defineProperty(this, 'send', {
                enumerable: true,
                value:      fn
            })
        }
    },

    destroy: {
        enumerable:   true,
        configurable: true,

        get: function () {
            assert.fail('undefined', 'function', this.name + ' plugin does not implement `destroy()`', '===')
        },

        set: function (fn) {
            assert.equal(typeof fn, 'function', '`destroy` must be a function')

            delete this.destroy
            Object.defineProperty(this, 'destroy', {
                enumerable: true,
                value:      fn
            })
        }
    },

    inspect: {
        enumerable: true,
        writable:   true,
        value:      inspect
    }
})

function inspect() {
    return 'HandoverPlugin {\n  ' +
        "name: '" + this.name + "',\n  " +
        'options: ' + require('util').format(this.options) +
        ' }'
}
