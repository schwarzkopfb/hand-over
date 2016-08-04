'use strict'

var Handover = require('hand-over'),
    notifier = new Handover

notifier.save = function (userId, channel, target, callback) {
    // It's used to save a target for a user/channel pair.
    // This method is required.
}

notifier.load = function (userId, channel, callback) {
    // It's used to load a saved target of a user/channel pair.
    // This method is required.
}

notifier.remove = function (userId, channel, target, callback) {
    // It's used to remove a saved target from a user/channel pair.
    // This method is required.
}

notifier.transform = function (userId, channel, payload, callback) {
    // It can be used to perform transformations on the notification payload
    // before sending it out. Useful for rendering templates, internationalisation, etc.
}

// Register Google Cloud Messaging channel.
notifier.use('gcm', 'google-cloud-messaging-service-api-key')

// Register Apple Push Notification Service channel.
notifier.use('apn', {
    address:    'gateway.sandbox.push.apple.com',
    cert:       __dirname + '/cert/apn.pem',
    key:        __dirname + '/cert/apn-key.pem',
    passphrase: '12345678'
})

// Register SendGrid as a notification channel.
notifier.use('sendgrid', {
    key:      'sendgrid-api-key',
    from:     'info@my-great-app.com',
    replyto:  'support@my-great-app.com',
    fromname: 'My Great App'
})

// ... initialize all your channels ...

// Register a new notification target.
notifier.register(userId, channel, target, callback)

// Remove a notification target of a user.
notifier.unregister(userId, channel, target, callback)

// Remove a all the notification targets of a channel.
notifier.unregister(userId, channel, callback)

// Send out a notification to a user via the specified channels.
notifier.send(userId, channels, payload, callback)

// Send out a notification to a user via all its registered channels.
notifier.send(userId, payload, callback)
