'use strict'

var Handover = require('../'),
    notifier = new Handover

notifier.use('./plugin')
notifier.use('./plugin2')

notifier.on('error', function (err) {
    console.log(err.plugin)
})

notifier.load = function (userId, channel, callback) {
    var base = userId + '_' + channel

    if (channel === 'test')
        callback(null, base)
    else
        callback(null, [
            base + '_1',
            base + '_2'
        ])
}

notifier.transform = function (userId, channel, payload, callback) {
    callback(null, JSON.stringify(payload))
}

notifier.send(1, 'test other_test', { alma: 'fa' }, function (errs) {
    console.log('done')

    if (errs)
        errs.forEach(function (err) {
            console.log('error:', err.channel, err.userId, err.target)
        })
})
