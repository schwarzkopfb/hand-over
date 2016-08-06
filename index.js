'use strict'

module.exports = Handover

var assert       = require('assert'),
    inherits     = require('util').inherits,
    EventEmitter = require('events').EventEmitter,
    words        = require('extw'),
    only         = require('only'),
    Plugin       = require('./plugin')

function Handover() {
    // make use of `new` optional
    if (!(this instanceof Handover))
        return new Handover

    EventEmitter.call(this)

    Object.defineProperties(this, {
        _plugins: {
            value: {}
        },

        _actions: {
            value: {}
        }
    })
}

inherits(Handover, EventEmitter)

// define static members
Object.defineProperties(Handover, {
    version: {
        enumerable: true,

        get: function () {
            return require('./package.json').version
        }
    },

    Plugin: {
        enumerable: true,

        get: function () {
            return Plugin
        }
    }
})

// define instance members
Object.defineProperties(Handover.prototype, {
    save: {
        enumerable: true,

        get: function () {
            return this._actions.save ||
                assert.fail('undefined', 'function', 'no method provided to save a target', '===')
        },

        set: function (fn) {
            assert.equal(typeof fn, 'function', '`save` must be a function')
            assert(fn.length >= 4, '`save` must take at least 4 arguments')
            this._actions.save = fn
        }
    },

    load: {
        enumerable: true,

        get: function () {
            return this._actions.load ||
                assert.fail('undefined', 'function', 'no method provided load a target', '===')
        },

        set: function (fn) {
            assert.equal(typeof fn, 'function', '`load` must be a function')
            assert(fn.length >= 3, '`load` must take at least 3 arguments')
            this._actions.load = fn
        }
    },

    remove: {
        enumerable: true,

        get: function () {
            return this._actions.remove ||
                assert.fail('undefined', 'function', 'no method provided remove a target', '===')
        },

        set: function (fn) {
            assert.equal(typeof fn, 'function', '`remove` must be a function')
            assert(fn.length >= 3, '`remove` must take at least 3 arguments')
            this._actions.remove = fn
        }
    },

    transform: {
        enumerable: true,

        get: function () {
            return this._actions.transform || noTransform
        },

        set: function (fn) {
            assert.equal(typeof fn, 'function', '`transform` must be a function')
            assert(fn.length >= 4, '`transform` must take at least 4 arguments')
            this._actions.transform = fn
        }
    },

    use: {
        enumerable: true,

        value: installPlugin
    },

    send: {
        enumerable: true,

        value: sendNotifications
    },

    register: {
        enumerable: true,

        value: registerTarget
    },

    unregister: {
        enumerable: true,

        value: unregisterTargets
    },

    inspect: {
        enumerable: true,

        value: inspect
    }
})

/**
 * Noop func for payload transformations.
 */
function noTransform(uid, chn, pl, cb) {
    cb(null, pl)
}

/**
 * Utility that clones an array.
 *
 * @param {Array} a
 * @return {Array}
 */
function cloneArray(a) {
    var b = [], i = a.length
    while (i--) b[ i ] = a[ i ]
    return b
}

/**
 * Include and initialize a plugin that handles a notification channel.
 *
 * @param {string|function|object} nameOrPlugin - Plugin name, constructor or instance to install.
 * @param {*} [options] - Initialization settings for the plugin.
 */
function installPlugin(nameOrPlugin, options) {
    assert(nameOrPlugin, 'name or plugin is required')

    var plugin,
        ctor,
        self   = this,
        parent = module.parent

    if (typeof nameOrPlugin === 'string')
        try {
            // local plugin
            if (nameOrPlugin.substring(0, 2) === './')
                ctor = parent.require(nameOrPlugin)
            // installed plugin with prefixed name 'hand-over-'
            else
                ctor = parent.require('hand-over-' + nameOrPlugin)
        }
        catch (ex) {
            // installed plugin without prefix
            ctor = parent.require(nameOrPlugin)
        }
    else
        ctor = nameOrPlugin

    // maybe we've got an already instantiated plugin
    if (ctor instanceof Plugin)
        plugin = ctor
    else {
        assert.equal(typeof ctor, 'function', 'plugin must provide a constructor')
        plugin = new ctor(options || {})
        assert(plugin instanceof Plugin, 'plugin must be a descendant of Handover.Plugin')
    }

    assert(plugin.name, 'plugin must expose a channel name')

    this._plugins[ plugin.name ] = plugin

    // delegate plugin errors for convenience
    plugin.on('error', function (err) {
        // decorate error object with channel name
        if (err && typeof err === 'object')
            err.channel = plugin.name

        self.emit('error', err)
    })
}

/**
 * Send a notification to a user via the selected channels.
 *
 * @param {*} userId - User identifier. Type is mostly string or number but depends on the consumer.
 * @param {string|string[]} [channels] - Optionally use only a subset of installed channels for this notification.
 * @param {*} payload - The actual notification data. Must be consumable by all the installed plugins.
 * @param {function} callback
 */
function sendNotifications(userId, channels, payload, callback) {
    // is channel list restricted?
    if (arguments.length < 4) {
        callback = data
        payload  = channels
        channels = this._plugins
    }
    else
        channels = only(this._plugins, words(channels))

    // helper for decorating error objects with debug info when possible,
    // then store it to pass back to the caller when we're done
    function failed(err, userId, channel, target) {
        if (err && typeof err === 'object') {
            err.userId  = userId
            err.channel = channel
            err.target  = target
        }

        errors.push(err)
        done()
    }

    // helper for counting finished operations and call back when we're done
    function done() {
        var arg = errors.length ? errors : null
        --pending || process.nextTick(callback, arg)
    }

    var self    = this,
        list    = Object.keys(channels),
        pending = list.length,
        errors  = []

    if (pending) {
        // iterate over the required channels
        list.forEach(function (name) {
            // apply payload transformation per channel
            self.transform(userId, name, payload, function (err, payload) {
                if (err)
                    return failed(err, userId, name)

                // get the targets for this channel
                self.load(userId, name, function (err, targets) {
                    if (err)
                        return failed(err, userId, name)

                    if (!Array.isArray(targets))
                        targets = [ targets ]
                    else {
                        // dereference the original array,
                        // because that may not be trustworthy
                        targets = cloneArray(targets)
                    }

                    if (targets.length) {
                        // we're initiating operations for each target,
                        // so we need to update the counter
                        pending += targets.length - 1
                        // get the plugin corresponding to channel
                        var channel = channels[ name ]

                        targets.forEach(function (target) {
                            channel.send(target, payload, function (err) {
                                if (err)
                                    failed(err, userId, name, target)
                                else
                                    done()
                            })
                        })
                    }
                    else
                        done()
                })
            })
        })
    }
    else {
        // no matching channels found,
        // so there is nothing to do here
        process.nextTick(callback, null)
    }
}

/**
 * Register a new target of a channel.
 *
 * @param {*} userId - User identifier. Type is mostly string or number but depends on the consumer.
 * @param {string} channel - Channel name.
 * @param {*} target - An address to send notifications to. Eg. phone number, email address, push notification token, etc.
 * @param {function} callback
 */
function registerTarget(userId, channel, target, callback) {
    this.save(userId, channel, target, function (err) {
        // ensure that we're firing the callback asynchronously
        process.nextTick(callback, err)
    })
}

/**
 * Remove a previously saved channel or target.
 *
 * @param {*} userId - User identifier. Type is mostly string or number but depends on the consumer.
 * @param {string} channel - Channel name.
 * @param {*|*[]} [targets] - The target or list of targets to remove. If not supplied, then all the targets of the given channel will be removed.
 * @param {function(?Error[])} callback
 */
function unregisterTargets(userId, channel, targets, callback) {
    var self = this

    // no target list specified, so we need to load all the targets
    // of the supplied channel
    if (arguments.length < 4) {
        // probably we've got the callback as the third arg
        callback = targets

        this.load(userId, channel, function (err, targets) {
            // cannot load targets of the given channel
            // call back with the error
            if (err) {
                if (typeof err === 'object') {
                    err.userId  = userId
                    err.channel = channel
                }

                process.nextTick(callback, [ err ])
            }
            // we've got that list!
            else {
                // ...or maybe that's not really a list?
                if (!Array.isArray(targets))
                    targets = [ targets ]

                removeTargets(self, userId, channel, targets, callback)
            }
        })
    }
    // we've got an explicit target list, go remove them
    else {
        // ...or maybe that's not really a list?
        if (!Array.isArray(targets))
            targets = [ targets ]

        removeTargets(self, userId, channel, targets, callback)
    }
}

/**
 * Internal func to remove the provided targets. Same as `unregisterTargets` but it assumes that `targets` is an array.
 *
 * @param {Handover} self - Handover instance to work on.
 * @param {*} userId
 * @param {string} channel
 * @param {*[]} targets
 * @param {function} callback
 */
function removeTargets(self, userId, channel, targets, callback) {
    // dereference the original array,
    // because that may not be trustworthy
    targets = cloneArray(targets)

    var pending = targets.length,
        errors  = []

    function done(target, err) {
        // something went wrong
        if (err) {
            // decorate errors with debug info
            if (typeof err === 'object') {
                err.userId  = userId
                err.channel = channel
                err.target  = target
            }

            // collect errors to pass back later to the caller
            errors.push(err)
        }

        // count pending operations and then pass back the control to the caller
        --pending || process.nextTick(callback, errors.length ? errors : null)
    }

    if (pending)
        targets.forEach(function (target) {
            // preserve `target` to be able to provide it in case of error
            self.remove(userId, channel, target, done.bind(null, target))
        })
    else {
        // no targets found, so
        // there is nothing to do here
        process.nextTick(callback, null)
    }
}

function inspect() {
    // todo
}
