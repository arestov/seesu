module.exports = Client

var debug = require('debug')('webtorrent-tracker')
var EventEmitter = require('events').EventEmitter
var extend = require('extend.js')
var hat = require('hat')
var inherits = require('inherits')
var Peer = require('simple-peer')
var Socket = require('simple-websocket')

var DEFAULT_NUM_WANT = 15

inherits(Client, EventEmitter)

// It turns out that you can't open multiple websockets to the same server within one
// browser tab, so let's reuse them.
var sockets = {}

/**
 * A Client manages tracker connections for a torrent.
 *
 * @param {string} peerId  this peer's id
 * @param {Object} torrent parsed torrent
 * @param {Object} opts    optional options
 * @param {Number} opts.numWant    number of peers to request
 * @param {Number} opts.interval   interval in ms to send announce requests to the tracker
 */
function Client (peerId, torrent, opts) {
  var self = this
  if (!(self instanceof Client)) return new Client(peerId, torrent, opts)
  EventEmitter.call(self)
  self._opts = opts || {}

  // required
  self._peerId = Buffer.isBuffer(peerId)
    ? peerId
    : new Buffer(peerId, 'utf8')
  self._infoHash = Buffer.isBuffer(torrent.infoHash)
    ? torrent.infoHash
    : new Buffer(torrent.infoHash, 'hex')
  self.torrentLength = torrent.length

  // optional
  self._numWant = self._opts.numWant || DEFAULT_NUM_WANT
  self._intervalMs = self._opts.interval || (30 * 60 * 1000) // default: 30 minutes

  debug('new client %s', self._infoHash.toString('hex'))

  if (typeof torrent.announce === 'string') torrent.announce = [ torrent.announce ]
  self._trackers = (torrent.announce || [])
    .filter(function (announceUrl) {
      return announceUrl.indexOf('ws://') === 0 || announceUrl.indexOf('wss://') === 0
    })
    .map(function (announceUrl) {
      return new Tracker(self, announceUrl, self._opts)
    })
}

Client.prototype.start = function (opts) {
  var self = this
  self._trackers.forEach(function (tracker) {
    tracker.start(opts)
  })
}

Client.prototype.stop = function (opts) {
  var self = this
  self._trackers.forEach(function (tracker) {
    tracker.stop(opts)
  })
}

Client.prototype.complete = function (opts) {
  var self = this
  self._trackers.forEach(function (tracker) {
    tracker.complete(opts)
  })
}

Client.prototype.update = function (opts) {
  var self = this
  self._trackers.forEach(function (tracker) {
    tracker.update(opts)
  })
}

Client.prototype.setInterval = function (intervalMs) {
  var self = this
  self._intervalMs = intervalMs

  self._trackers.forEach(function (tracker) {
    tracker.setInterval(intervalMs)
  })
}

inherits(Tracker, EventEmitter)

/**
 * An individual torrent tracker (used by Client)
 *
 * @param {Client} client       parent bittorrent tracker client
 * @param {string} announceUrl  announce url of tracker
 * @param {Object} opts         optional options
 */
function Tracker (client, announceUrl, opts) {
  var self = this
  EventEmitter.call(self)
  self._opts = opts || {}
  self._announceUrl = announceUrl
  self._peers = {} // peers (offer id -> peer)

  debug('new tracker %s', announceUrl)

  self.client = client
  self.ready = false

  self._socket = null
  self._intervalMs = self.client._intervalMs // use client interval initially
  self._interval = null
}

Tracker.prototype.start = function (opts) {
  var self = this
  opts = opts || {}
  opts.event = 'started'

  debug('sent `start` %s %s', self._announceUrl, JSON.stringify(opts))
  self._announce(opts)
  self.setInterval(self._intervalMs) // start announcing on intervals
}

Tracker.prototype.stop = function (opts) {
  var self = this
  opts = opts || {}
  opts.event = 'stopped'

  debug('sent `stop` %s %s', self._announceUrl, JSON.stringify(opts))
  self._announce(opts)
  self.setInterval(0) // stop announcing on intervals

  // TODO: destroy the websocket
}

Tracker.prototype.complete = function (opts) {
  var self = this
  opts = opts || {}
  opts.event = 'completed'
  opts.downloaded = opts.downloaded || self.torrentLength || 0

  debug('sent `complete` %s %s', self._announceUrl, JSON.stringify(opts))
  self._announce(opts)
}

Tracker.prototype.update = function (opts) {
  var self = this
  opts = opts || {}

  debug('sent `update` %s %s', self._announceUrl, JSON.stringify(opts))
  self._announce(opts)
}

Tracker.prototype._init = function (onready) {
  var self = this
  if (onready) self.once('ready', onready)
  if (self._socket) return

  if (sockets[self._announceUrl]) {
    self._socket = sockets[self._announceUrl]
    self._onSocketReady()
  } else {
    self._socket = sockets[self._announceUrl] = new Socket(self._announceUrl)
    self._socket.on('ready', self._onSocketReady.bind(self))
  }
  self._socket.on('warning', self._onSocketWarning.bind(self))
  self._socket.on('error', self._onSocketWarning.bind(self))
  self._socket.on('message', self._onSocketMessage.bind(self))
}

Tracker.prototype._onSocketReady = function () {
  var self = this
  self.ready = true
  self.emit('ready')
}

Tracker.prototype._onSocketWarning = function (err) {
  debug('tracker warning %s', err.message)
}

Tracker.prototype._onSocketMessage = function (data) {
  var self = this

  if (!(typeof data === 'object' && data !== null))
    return self.client.emit('warning', new Error('Invalid tracker response'))

  if (data.info_hash !== self.client._infoHash.toString('binary'))
    return

  debug('received %s from %s', JSON.stringify(data), self._announceUrl)

  var failure = data['failure reason']
  if (failure)
    return self.client.emit('warning', new Error(failure))

  var warning = data['warning message']
  if (warning)
    self.client.emit('warning', new Error(warning))

  var interval = data.interval || data['min interval']
  if (interval && !self._opts.interval && self._intervalMs !== 0) {
    // use the interval the tracker recommends, UNLESS the user manually specifies an
    // interval they want to use
    self.setInterval(interval * 1000)
  }

  var trackerId = data['tracker id']
  if (trackerId) {
    // If absent, do not discard previous trackerId value
    self._trackerId = trackerId
  }

  if (data.complete) {
    self.client.emit('update', {
      announce: self._announceUrl,
      complete: data.complete,
      incomplete: data.incomplete
    })
  }

  var peer
  if (data.offer) {
    peer = new Peer({ trickle: false })
    peer.id = binaryToHex(data.peer_id)
    peer.once('signal', function (answer) {
      var opts = {
        info_hash: self.client._infoHash.toString('binary'),
        peer_id: self.client._peerId.toString('binary'),
        to_peer_id: data.peer_id
      }

      if (self._trackerId)
        opts.trackerid = self._trackerId

      self._send(extend({
        answer: answer,
        offer_id: data.offer_id
      }, opts))
    })
    peer.signal(data.offer)
    self.client.emit('peer', peer)
  }

  if (data.answer) {
    peer = self._peers[data.offer_id]
    if (peer) {
      peer.signal(data.answer)
      self.client.emit('peer', peer)
    }
  }
}

/**
 * Send an announce request to the tracker.
 * @param {Object} opts
 * @param {number=} opts.uploaded
 * @param {number=} opts.downloaded
 * @param {number=} opts.left (if not set, calculated automatically)
 */
Tracker.prototype._announce = function (opts) {
  var self = this
  if (!self.ready) return self._init(self._announce.bind(self, opts))

  self._generateOffers(function (offers) {
    opts = extend({
      uploaded: 0, // default, user should provide real value
      downloaded: 0, // default, user should provide real value
      info_hash: self.client._infoHash.toString('binary'),
      peer_id: self.client._peerId.toString('binary'),
      offers: offers
    }, opts)

    if (self.client.torrentLength != null && opts.left == null) {
      opts.left = self.client.torrentLength - (opts.downloaded || 0)
    }

    if (self._trackerId) {
      opts.trackerid = self._trackerId
    }
    self._send(opts)
  })
}

Tracker.prototype._send = function (opts) {
  var self = this
  debug('send %s', JSON.stringify(opts))
  self._socket.send(opts)
}

Tracker.prototype._generateOffers = function (cb) {
  var self = this
  var offers = []
  debug('generating %s offers', self.client._numWant)

  // TODO: cleanup dead peers and peers that never get a return offer, from self._peers
  for (var i = 0; i < self.client._numWant; ++i) {
    generateOffer()
  }

  function generateOffer () {
    var offerId = hat(160)
    var peer = self._peers[offerId] = new Peer({ initiator: true, trickle: false })
    peer.once('signal', function (offer) {
      offers.push({
        offer: offer,
        offer_id: offerId
      })
      checkDone()
    })
  }

  function checkDone () {
    if (offers.length === self.client._numWant) {
      debug('generated %s offers', self.client._numWant)
      cb(offers)
    }
  }
}

Tracker.prototype.setInterval = function (intervalMs) {
  var self = this
  clearInterval(self._interval)

  self._intervalMs = intervalMs
  if (intervalMs) {
    self._interval = setInterval(self.update.bind(self), self._intervalMs)
  }
}

function binaryToHex (id) {
  return new Buffer(id, 'binary').toString('hex')
}
