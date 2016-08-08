'use strict'

var inherits       = require('util').inherits,
    AssertionError = require('assert').AssertionError,
    test           = require('tap'),
    Handover       = require('../'),
    n              = new Handover

test.plan(29)

function noop() {
}

function TestPlugin(opts) {
    Handover.Plugin.call(this, opts)
    this.name = 'channel'

    this.send = function (target, payload, callback) {
        test.equal(target, 'target')
        test.equal(payload, 'transformed')
        test.type(callback, 'function')
        callback()
    }
}

inherits(TestPlugin, Handover.Plugin)

n.use(TestPlugin)

test.throws(
    function () {
        n.save = 'error'
    },
    AssertionError,
    '`save` method should be asserted'
)
test.throws(
    function () {
        n.save = noop
    },
    AssertionError,
    'argument count of `save` should be asserted'
)
test.throws(
    function () {
        n.load = 'error'
    },
    AssertionError,
    '`load` method should be asserted'
)
test.throws(
    function () {
        n.load = noop
    },
    AssertionError,
    'argument count of `load` should be asserted'
)
test.throws(
    function () {
        n.remove = 'error'
    },
    AssertionError,
    '`remove` method should be asserted'
)
test.throws(
    function () {
        n.remove = noop
    },
    AssertionError,
    'argument count of `remove` should be asserted'
)
test.throws(
    function () {
        n.transform = 'error'
    },
    AssertionError,
    '`transform` method should be asserted'
)
test.throws(
    function () {
        n.transform = noop
    },
    AssertionError,
    'argument count of `transform` should be asserted'
)

n.save = n.remove = function (userId, channel, target, callback) {
    test.equal(userId, 42)
    test.equal(channel, 'channel')
    test.equal(target, 'target')
    test.type(callback, 'function')
    callback()
}

n.load = function (userId, channel, callback) {
    test.equal(userId, 42)
    test.equal(channel, 'channel')
    test.type(callback, 'function')
    callback(null, 'target')
}

n.transform = function (userId, channel, payload, callback) {
    test.equal(userId, 42)
    test.equal(channel, 'channel')
    test.equal(payload, 'payload')
    test.type(callback, 'function')
    callback(null, 'transformed')
}

n.register(42, 'channel', 'target', function () {
    n.send(42, 'channel', 'payload', function () {
        n.unregister(42, 'channel', noop)
    })
})
