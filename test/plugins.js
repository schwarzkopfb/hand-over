'use strict'

var assert   = require('assert'),
    inherits = require('util').inherits,
    test     = require('tap'),
    Handover = require('../'),
    n        = new Handover,
    p1       = require('./plugin1'),
    opts     = { test: 42 },
    p1inst   = new p1(opts)

test.plan(3)

function noop() {
}

test.test('`use()` signatures', function (test) {
    test.plan(11)

    test.doesNotThrow(
        function () {
            // do not pass an options obj to test defaulting to `{}`
            n.use(p1)
        },
        'plugin constructor should be accepted, `options` should be optional'
    )
    test.doesNotThrow(
        function () {
            // options obj is ignored by `use()` in this case
            n.use(p1inst)
        },
        'plugin instance should be accepted'
    )
    test.doesNotThrow(
        function () {
            n.use('./plugin2', opts)
        },
        'plugin should be required directly'
    )
    test.doesNotThrow(
        function () {
            n.use('plugin3', opts)
        },
        'plugin should be required directly'
    )
    test.doesNotThrow(
        function () {
            n.use('plugin4', opts)
        },
        'plugin should be required directly'
    )
    test.throws(
        function () {
            n.use()
        },
        assert.AssertionError,
        '`use()` should assert its args'
    )
    test.throws(
        function () {
            n.use(42)
        },
        assert.AssertionError,
        '`use()` should assert its args'
    )
    test.throws(
        function () {
            n.use(opts)
        },
        assert.AssertionError,
        '`use()` should assert its args'
    )
    test.throws(
        function () {
            n.use(noop)
        },
        assert.AssertionError,
        '`use()` should assert its args'
    )
    test.throws(
        function () {
            n.use({ /* name is missing */ send: noop })
        },
        assert.AssertionError,
        '`use()` should assert its args'
    )
    test.throws(
        function () {
            n.use({ name: 'test' /* send fn not specified */ })
        },
        assert.AssertionError,
        '`use()` should assert its args'
    )
})

test.test('error delegation', function (test) {
    test.plan(3)

    var error = new Error('test')

    n.once('error', function (err) {
        test.equal(err, error, 'error emitted by plugin should be caught on notifier')
        test.equal(err.channel, 'test0', 'channel should be added to error')
    })
    p1inst.emitError(error)

    n.once('error', function (err) {
        test.equal(err, 'test', 'non-standard error values should not cause any problem')
    })
    p1inst.emitError('test')
})

test.test('unref', function (test) {
    test.plan(2)

    function TestPlugin() {
        Handover.Plugin.call(this)
        this.name = 'test'
        this.send = function (a, b, c) {}
        this.unref = function () {
            test.pass('`unref()` called instead of destroy')
        }
        this.destroy = function () {
            test.pass('`destroy()` is used when no `unref()` present')
        }
    }
    inherits(TestPlugin, Handover.Plugin)
    var plugin = new TestPlugin

    n.use(plugin)
    n.unref()
    delete plugin.unref
    n.unref()
})
