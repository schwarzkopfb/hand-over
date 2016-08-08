'use strict'

// todo: still waiting for my `tap` PR to be merged
// Object.prototype[ 'this should not mess up anything' ] = null

var assert       = require('assert'),
    EventEmitter = require('events').EventEmitter,
    test         = require('tap'),
    Handover     = require('../'),
    Plugin       = require('../plugin')

function noop() {
}

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
test.type(n.inspect(), 'string', 'instance inspection should return a string')

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

test.test('chaining', function (test) {
    // todo
    test.end()
})

test.test('plugin', function (test) {
    var p = new Plugin

    test.throws(
        function () {
            p.name
        },
        assert.AssertionError,
        'plugin name exposition should be enforced'
    )
    test.throws(
        function () {
            p.send
        },
        assert.AssertionError,
        'plugin `send` fn exposition should be enforced'
    )

    // set the name otherwise it still throws ans
    // inspect will try to get that
    p.name = 'test'

    test.type(p.inspect, 'function', 'instance should have a custom `inspect()` fn')
    test.type(p.inspect(), 'string', 'instance inspection should return a string')

    test.end()
})
