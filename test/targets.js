'use strict'

// support Node <1
process.nextTick = require('process.nexttick')

var test     = require('tap'),
    chain    = require('./chain'),
    Handover = require('../'),
    n        = new Handover

test.plan(24)

var db = {}

function record(userId, channel) {
    var rec, arr

    if (!(userId in db))
        rec = db [ userId ] = {}
    else
        rec = db [ userId ]

    if (!(channel in rec))
        arr = rec[ channel ] = []
    else
        arr = rec[ channel ]

    return arr
}

function save(userId, channel, target, callback) {
    record(userId, channel).push(target)
    callback()
}

function load(userId, channel, callback) {
    var res = record(userId, channel)
    callback(null, res.length === 1 ? res[ 0 ] : res)
}

function remove(userId, channel, target, callback) {
    var list = record(userId, channel),
        i    = list.indexOf(target)

    if (~i)
        list.splice(i, 1)

    callback()
}

n.save   = save
n.load   = load
n.remove = remove

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

var tests = [
    function () {
        n.register(1, 'foo', 'bar', callback())
        test.same(db, { '1': { foo: [ 'bar' ] } }, 'target should be saved')
        test.equal(counter, 0, 'callback should be called in the next tick')
    },
    function () {
        n.unregister(1, 'foo', 'baz', callback())
        test.same(db, { '1': { foo: [ 'bar' ] } }, 'absent target should not affect anything')
        test.equal(counter, 1, 'callback should be called in the next tick')
    },
    function () {
        n.unregister(1, 'foo', 'bar', callback())
        test.same(db, { '1': { foo: [] } }, 'target should be removed')
        test.equal(counter, 2, 'callback should be called in the next tick')
    },
    function () {
        n.register(1, 'foo', 'bar', callback())
        n.register(1, 'foo', 'baz', callback())
        n.register(1, 'foo', 'foo', callback())
        test.equal(counter, 3, 'callback should be called in the next tick')
    },
    // unregister multiple targets at once
    function () {
        n.unregister(1, 'foo', [ 'foo', 'baz' ], callback())
        test.equal(counter, 6, 'callback should be called in the next tick')
    },
    // unregister all the targets of a channel
    function () {
        n.unregister(1, 'foo', callback())
        test.equal(counter, 7, 'callback should be called in the next tick')
    },
    // nothing to unregister
    function () {
        n.unregister(1, 'foo', callback())
        test.equal(counter, 8, 'callback should be called in the next tick')
    },
    // produce error through `load`
    function () {
        var err = new Error('test')
        // overwrite `load`
        n.load  = function (userId, channel, callback) {
            callback(err)
        }
        n.unregister(1, 'foo', callback())
        return err
    },
    // validate error
    function (err) {
        test.same(error, [ err ], 'an error array should be returned')
        test.equal(err.userId, 1, 'error should be decorated with `userId`')
        test.equal(err.channel, 'foo', 'error should be decorated with `channel`')
        test.equal(counter, 10, 'callback should be called in the next tick')
    },
    // produce non-standard error through `load`
    function () {
        // overwrite `load`
        n.load = function (userId, channel, callback) {
            callback('test')
        }
        n.unregister(1, 'foo', callback())
        return 'test'
    },
    // validate error
    function (err) {
        test.same(error, [ err ], 'an error array should be returned')
        test.equal(counter, 11, 'callback should be called in the next tick')
    },
    // produce error through `remove`
    function () {
        var err  = new Error('test')
        // restore the orig `load` fn
        n.load   = load
        // overwrite `remove`
        n.remove = function (userId, channel, target, callback) {
            callback(err)
        }
        n.register(1, 'foo', 'bar', callback())
        n.unregister(1, 'foo', 'bar', callback())
        return err
    },
    // validate error
    function (err) {
        test.same(error, [ err ], 'an error array should be returned')
        test.equal(err.userId, 1, 'error should be decorated with `userId`')
        test.equal(err.channel, 'foo', 'error should be decorated with `channel`')
        test.equal(err.target, 'bar', 'error should be decorated with `target`')
        test.equal(counter, 13, 'callback should be called in the next tick')
    },
    // produce non-standard error through `remove`
    function () {
        // restore the orig `load` fn
        n.load   = load
        // overwrite `remove`
        n.remove = function (userId, channel, target, callback) {
            callback('test')
        }
        n.register(1, 'foo', 'bar', callback())
        n.unregister(1, 'foo', 'bar', callback())
        return 'test'
    },
    // validate error
    function (err) {
        test.same(error, [ err ], 'an error array should be returned')
        test.equal(counter, 15, 'callback should be called in the next tick')
    },
    function () {
        test.notOk(pending, 'all the callbacks should be called')
    }
]

chain(tests)
