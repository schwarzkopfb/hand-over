'use strict'

var assert       = require('assert'),
    EventEmitter = require('events').EventEmitter,
    test         = require('tap'),
    Handover     = require('../'),
    Plugin       = require('../plugin')

function noop() {
}

test.test('main', function (test) {
    test.type(Handover, 'function', 'main export must be a function')
    test.equal(Handover.Plugin, Plugin, 'Plugin constructor should be exposed')
    test.equal(Handover.version, require('../package.json').version, 'package version should be exposed correctly')

    var n = new Handover
    test.type(n, EventEmitter, 'Handover should be derived from EventEmitter')
    n = Handover()
    test.type(n, Handover, 'constructor should work without `new`')
    test.type(n.use, 'function', 'instance should have a `use()` fn')
    test.type(n.send, 'function', 'instance should have a `send()` fn')
    test.type(n.register, 'function', 'instance should have a `register()` fn')
    test.type(n.unregister, 'function', 'instance should have a `unregister()` fn')
    test.type(n.inspect, 'function', 'instance should have a custom `inspect()` fn')

    test.throws(
        function () {
            n.save()
        },
        assert.AssertionError,
        'accessing uninitialized required methods should throw'
    )
    test.throws(
        function () {
            n.load()
        },
        assert.AssertionError,
        'accessing uninitialized required methods should throw'
    )
    test.throws(
        function () {
            n.remove()
        },
        assert.AssertionError,
        'accessing uninitialized required methods should throw'
    )
    test.doesNotThrow(
        function () {
            n.transform(null, null, null, noop)
        },
        'accessing uninitialized not required  methods should not throw'
    )
    test.type(n.transform, 'function', '`transform` should have a default fn')

    test.end()
})

test.test('plugin', function (test) {
    var plugin = new Plugin

    test.throws(
        function () {
            plugin.name
        },
        assert.AssertionError,
        'plugin name exposition should be enforced'
    )
    test.throws(
        function () {
            plugin.send
        },
        assert.AssertionError,
        'plugin `send` fn exposition should be enforced'
    )

    test.end()
})
