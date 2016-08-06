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

var payload = {},
    foo     = new TestPlugin('foo'),
    bar     = new TestPlugin('bar'),
    baz     = new TestPlugin('baz')

n.use(foo)
 .use(bar)
 .use(baz)

n.save = function (userId, channel, target, callback) {
    callback()
}

n.load = function (userId, channel, callback) {
    callback(null, 'moon')
}

// todo: validate next tick
n.send(1, payload, function (err) {
    test.notOk(err, 'no error should be returned')
    test.same(foo.lastTarget, 'moon', 'correct target should be used')
    test.same(foo.lastPayload, payload, 'payload should be delivered')
    test.same(bar.lastTarget, 'moon', 'correct target should be used')
    test.same(bar.lastPayload, payload, 'payload should be delivered')
    test.same(baz.lastTarget, 'moon', 'correct target should be used')
    test.same(baz.lastPayload, payload, 'payload should be delivered')
})