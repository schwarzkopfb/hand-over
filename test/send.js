'use strict'

// support Node <1
process.nextTick = require('process.nexttick')

var inherits = require('util').inherits,
    test     = require('tap'),
    chain    = require('./chain'),
    Handover = require('../'),
    Plugin   = Handover.Plugin,
    n        = new Handover

test.plan(87)

function TestPlugin(name) {
    Plugin.call(this, name)
    this.name      = name
    this.delivered = 0
}

inherits(TestPlugin, Plugin)

TestPlugin.prototype.send = function (target, payload, callback) {
    this.delivered++
    this.lastTarget  = target
    this.lastPayload = payload
    callback(this.failWith)
}

var foo = new TestPlugin('foo'),
    bar = new TestPlugin('bar'),
    baz = new TestPlugin('baz')

n.use(foo)
 .use(bar)
 .use(baz)

function loadOne(userId, channel, callback) {
    callback(null, 'moon')
}

function loadList(userId, channel, callback) {
    callback(null, [ 'moon' ])
}

function loadEmptyList(userId, channel, callback) {
    callback(null, [])
}

function loadMulti(userId, channel, callback) {
    callback(null, [ 'mars', 'moon' ])
}

n.load = loadOne
n.save = function (userId, channel, target, callback) {
    callback()
}

var counter = 0,
    pending = 0,
    error

function callback() {
    var called
    pending++

    return function (err) {
        if (called)
            test.bailout('callback called more than once')
        else
            called = true

        error = err
        counter++
        pending--
    }
}

function validate(channels, target, payload, count) {
    channels.forEach(function (channel) {
        test.same(channel.delivered, count, 'message should be delivered')

        if (target)
            test.same(channel.lastTarget, target, 'correct target should be used')

        test.same(channel.lastPayload, payload, 'payload should be delivered')
    })
}

var tests = [
    // send to all channels
    function () {
        var payload = {}
        n.send(1, payload, callback())
        test.equal(counter, 0, 'callback should be called in the next tick')
        return payload
    },
    // restricted channel list
    function (payload) {
        test.notOk(error, 'error should not be returned')
        validate([ foo, bar, baz ], 'moon', payload, 1)
        test.equal(counter, 1, 'callback should be called in the next tick')
        n.send(1, 'foo bar', payload, callback())
        return payload
    },
    // empty channel list
    function (payload) {
        test.notOk(error, 'error should not be returned')
        validate([ foo, bar ], 'moon', payload, 2)
        validate([ baz ], 'moon', payload, 1)
        // make counters equal again for easier validation
        baz.delivered++
        n.send(1, [], payload, callback())
        test.equal(counter, 2, 'callback should be called in the next tick')
        return payload
    },
    function (payload) {
        test.notOk(error, 'error should not be returned')
        // note: delivery counters must remain the same
        validate([ foo, bar, baz ], 'moon', payload, 2)
        test.equal(counter, 3, 'callback should be called in the next tick')
    },
    // pass a single target as an array
    function () {
        n.load = loadList
        n.send(1, 'spaceship', callback())
    },
    function () {
        test.notOk(error, 'error should not be returned')
        validate([ foo, bar, baz ], 'moon', 'spaceship', 3)
        test.equal(counter, 4, 'callback should be called in the next tick')
    },
    // use multiple targets
    function () {
        n.load = loadMulti
        n.send(1, 'animal', callback())
    },
    function () {
        test.notOk(error, 'error should not be returned')
        // note: two messages per channel,
        // so counter has been increased with two
        validate([ foo, bar, baz ], 'moon', 'animal', 5)
        test.equal(counter, 5, 'callback should be called in the next tick')
    },
    // use a an empty target array
    function () {
        n.load = loadEmptyList
        n.send(1, 'man', callback())
    },
    function () {
        test.notOk(error, 'error should not be returned')
        // note: delivery counters and payload must remain the same
        validate([ foo, bar, baz ], 'moon', 'animal', 5)
        test.equal(counter, 6, 'callback should be called in the next tick')
    },
    // transform error during send
    function () {
        var err     = new Error('test')
        n.load      = loadOne
        n.transform = function (userId, channel, payload, callback) {
            callback(err)
        }
        n.send(1, 'foo', 'message', callback())
        test.equal(counter, 6, 'callback should be called in the next tick')
        return err
    },
    function (err) {
        test.same(error, [ err ], 'errors array should be returned')
        test.equal(err.userId, 1, 'error should be decorated with userId')
        test.equal(err.channel, 'foo', 'error should be decorated with channel')
        test.equal(counter, 7, 'callback should be called in the next tick')
        return err
    },
    // load error during send
    function (err) {
        n.transform = function (userId, channel, payload, callback) {
            callback(null, payload)
        }
        n.load      = function (userId, channel, callback) {
            callback(err)
        }
        n.send(1, 'foo', 'message', callback())
        test.equal(counter, 7, 'callback should be called in the next tick')
        return err
    },
    function (err) {
        test.same(error, [ err ], 'errors array should be returned')
        test.equal(err.userId, 1, 'error should be decorated with userId')
        test.equal(err.channel, 'foo', 'error should be decorated with channel')
        test.equal(counter, 8, 'callback should be called in the next tick')
    },
    // plugin error during send
    function () {
        var err      = new Error('test')
        n.load       = loadOne
        foo.failWith = err
        n.send(1, 'foo', 'message', callback())
        test.equal(counter, 8, 'callback should be called in the next tick')
        return err
    },
    function (err) {
        test.same(error, [ err ], 'errors array should be returned')
        test.equal(err.userId, 1, 'error should be decorated with userId')
        test.equal(err.channel, 'foo', 'error should be decorated with channel')
        test.equal(err.target, 'moon', 'error should be decorated with target')
        test.equal(counter, 9, 'callback should be called in the next tick')
    },
    // non-standard plugin error during send
    function () {
        var err      = 'test'
        n.load       = loadOne
        foo.failWith = err
        n.send(1, 'foo', 'message', callback())
        test.equal(counter, 9, 'callback should be called in the next tick')
        return err
    },
    function (err) {
        test.same(error, [ err ], 'errors array should be returned')
        test.equal(counter, 10, 'callback should be called in the next tick')
    },
    function () {
        test.notOk(pending, 'all the callbacks should be called')
    }
]

chain(tests)
