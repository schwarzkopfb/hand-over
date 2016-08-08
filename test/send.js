'use strict'

var inherits = require('util').inherits,
    test     = require('tap'),
    Handover = require('../'),
    Plugin   = Handover.Plugin,
    n        = new Handover

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
    callback()
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
    }
    // todo: transformations
    // todo: errors
]

void function next(i, val) {
    var fn = tests[ i++ ]

    if (fn)
        process.nextTick(next, i, fn(val))
}(0)