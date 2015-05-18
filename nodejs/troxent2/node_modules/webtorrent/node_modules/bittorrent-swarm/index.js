module.exports = Swarm

var addrToIPPort = require('addr-to-ip-port') // browser exclude
var debug = require('debug')('bittorrent-swarm')
var dezalgo = require('dezalgo')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var net = require('net') // browser exclude
var Peer = require('./lib/peer')
var speedometer = require('speedometer')
var TCPPool = require('./lib/tcp-pool')

var MAX_CONNS = 55
var RECONNECT_WAIT = [ 1000, 5000, 15000, 30000, 60000, 120000, 300000, 600000 ]

inherits(Swarm, EventEmitter)

/**
 * BitTorrent Swarm
 *
 * Abstraction of a BitTorrent "swarm", which is handy for managing all peer
 * connections for a given torrent download. This handles connecting to peers,
 * listening for incoming connections, and doing the initial peer wire protocol
 * handshake with peers. It also tracks total data uploaded/downloaded to/from
 * the swarm.
 *
 * @param {Buffer|string} infoHash
 * @param {Buffer|string} peerId
 * @param {Object} opts
 * @param {Object} opts.handshake handshake options (passed to bittorrent-protocol)
 * @param {number} opts.maxConns maximum number of connections in swarm
 */
function Swarm (infoHash, peerId, opts) {
  var self = this
  if (!(self instanceof Swarm)) return new Swarm(infoHash, peerId, opts)
  EventEmitter.call(self)

  self.infoHash = typeof infoHash === 'string'
    ? new Buffer(infoHash, 'hex')
    : infoHash
  self.infoHashHex = self.infoHash.toString('hex')

  self.peerId = typeof peerId === 'string'
    ? new Buffer(peerId, 'hex')
    : peerId
  self.peerIdHex = self.peerId.toString('hex')

  if (!opts) opts = {}

  debug('new swarm (i %s p %s)', self.infoHashHex, self.peerIdHex)

  self.handshakeOpts = opts.handshake // handshake extensions (optional)
  self.maxConns = opts.maxConns !== undefined ? opts.maxConns : MAX_CONNS

  self.destroyed = false
  self.listening = false
  self.paused = false

  self.server = null // tcp listening socket
  self.wires = [] // open wires (added *after* handshake)

  self._queue = [] // queue of outgoing tcp peers to connect to
  self._peers = {} // connected peers (addr/peerId -> Peer)
  self._peersLength = 0 // number of elements in `self._peers` (cache, for perf)
  self._port = 0 // tcp listening port (cache, for perf)

  // track stats
  self.downloaded = 0
  self.uploaded = 0
  self.downloadSpeed = speedometer()
  self.uploadSpeed = speedometer()
}

Object.defineProperty(Swarm.prototype, 'ratio', {
  get: function () {
    var self = this
    return (self.uploaded / self.downloaded) || 0
  }
})

Object.defineProperty(Swarm.prototype, 'numQueued', {
  get: function () {
    var self = this
    return self._queue.length + (self._peersLength - self.numConns)
  }
})

Object.defineProperty(Swarm.prototype, 'numConns', {
  get: function () {
    var self = this
    var numConns = 0
    for (var id in self._peers) {
      var peer = self._peers[id]
      if (peer && peer.conn) numConns += 1
    }
    return numConns
  }
})

Object.defineProperty(Swarm.prototype, 'numPeers', {
  get: function () {
    var self = this
    return self.wires.length
  }
})

/**
 * Add a peer to the swarm.
 * @param {string|Peer} peer    "ip:port" string or simple-peer instance
 * @param {string}      peer.id bittorrent peer id (only when `peer` is simple-peer)
 */
Swarm.prototype.addPeer = function (peer) {
  var self = this
  if (self.destroyed) {
    if (peer && peer.destroy) peer.destroy()
    return
  }
  if (typeof peer === 'string' && !self._validAddr(peer)) {
    debug('ignoring invalid peer %s (from swarm.addPeer)', peer)
    return
  }

  var id = (peer && peer.id) || peer
  if (self._peers[id]) return

  debug('addPeer %s', id)

  var newPeer
  if (typeof peer === 'string') {
    // `peer` in an addr ("ip:port" string)
    newPeer = Peer.createOutgoingTCPPeer(peer, self)
    self._queue.push(newPeer)
    self._drain()
  } else {
    // `peer` is a WebRTC connection (simple-peer)
    newPeer = Peer.createWebRTCPeer(peer, self)
  }
  self._peers[newPeer.id] = newPeer
  self._peersLength += 1
}

/**
 * Called whenever a new incoming TCP peer connects to this swarm. Called with a peer
 * that has already sent a handshake.
 * @param {Peer} peer
 */
Swarm.prototype._addIncomingPeer = function (peer) {
  var self = this
  if (self.destroyed || self.paused) return peer.destroy()

  if (!self._validAddr(peer.addr)) {
    debug('ignoring invalid peer %s (from incoming)', peer.addr)
    return peer.destroy()
  }

  self._peers[peer.id] = peer
  self._peersLength += 1
}

/**
 * Private method to remove a peer from the swarm without calling _drain().
 * @param  {string} id for tcp peers, "ip:port" string; for webrtc peers, peerId
 */
Swarm.prototype._removePeer = function (id) {
  var self = this
  var peer = self._peers[id]
  if (!peer) return

  debug('_removePeer %s', id)

  self._peers[id] = null
  self._peersLength -= 1

  peer.destroy()
}

/**
 * Temporarily stop connecting to new peers. Note that this does not pause new
 * incoming connections, nor does it pause the streams of existing connections
 * or their wires.
 */
Swarm.prototype.pause = function () {
  var self = this
  if (self.destroyed) return
  debug('pause')
  self.paused = true
}

/**
 * Resume connecting to new peers.
 */
Swarm.prototype.resume = function () {
  var self = this
  if (self.destroyed) return
  debug('resume')
  self.paused = false
  self._drain()
}

/**
 * Listen on the given port for peer connections.
 * @param  {number=} port
 * @param  {function} onlistening
 */
Swarm.prototype.listen = function (port, onlistening) {
  var self = this
  if (typeof port === 'function') {
    onlistening = port
    port = undefined
  }
  if (onlistening) onlistening = dezalgo(onlistening)

  if (self.listening) throw new Error('swarm already listening')

  if (process.browser) {
    onlistening()
  } else {
    self._port = port || TCPPool.getDefaultListenPort(self.infoHashHex)
    if (onlistening) self.once('listening', onlistening)

    debug('listen %s', port)

    var pool = TCPPool.addSwarm(self)
    self.server = pool.server
  }
}

Swarm.prototype._onListening = function (port) {
  var self = this
  self._port = port
  self.listening = true
  self.emit('listening')
}

Swarm.prototype.address = function () {
  var self = this
  return self.server.address()
}

/**
 * Destroy the swarm, close all open peer connections, and do cleanup.
 * @param {function} onclose
 */
Swarm.prototype.destroy = function (onclose) {
  var self = this
  if (self.destroyed) return

  self.destroyed = true
  self.listening = false
  self.paused = false

  if (onclose) self.once('close', onclose)

  debug('destroy')

  for (var id in self._peers) {
    self._removePeer(id)
  }

  TCPPool.removeSwarm(self)

  // TODO: only emit when all peers and server is destroyed
  process.nextTick(function () {
    self.emit('close')
  })
}

/**
 * Pop a peer off the FIFO queue and connect to it. When _drain() gets called,
 * the queue will usually have only one peer in it, except when there are too
 * many peers (over `this.maxConns`) in which case they will just sit in the
 * queue until another connection closes.
 */
Swarm.prototype._drain = function () {
  var self = this
  if (self.destroyed || self.paused || self.numConns >= self.maxConns) return
  debug('drain (%s queued, %s/%s peers)', self.numQueued, self.numPeers, self.maxConns)

  var peer = self._queue.shift()
  if (!peer) return // queue could be empty

  debug('tcp connect attempt to %s', peer.addr)
  var parts = addrToIPPort(peer.addr)
  var conn = peer.conn = net.connect(parts[1], parts[0])

  conn.on('connect', function () { peer.onConnect() })
  conn.on('error', function () { conn.destroy() })
  peer.setTimeout()

  // When connection closes, attempt reconnect after timeout (with exponential backoff)
  conn.on('close', function () {
    if (self.destroyed || peer.retries >= RECONNECT_WAIT.length) {
      return
    }

    function readd () {
      var newPeer = Peer.createOutgoingTCPPeer(peer.addr, self)
      newPeer.retries = peer.retries + 1
      self._queue.push(newPeer)
      self._drain()
    }

    var readdTimeout = setTimeout(readd, RECONNECT_WAIT[peer.retries])
    if (readdTimeout.unref) readdTimeout.unref()
  })
}

Swarm.prototype._onError = function (err) {
  var self = this
  self.emit('error', err)
  self.destroy()
}

/**
 * Returns `true` if string is valid IPv4/6 address, and is not the address of this swarm.
 * @param {string} addr
 * @return {boolean}
 */
Swarm.prototype._validAddr = function (addr) {
  var self = this
  var parts = addrToIPPort(addr)
  var ip = parts[0]
  var port = parts[1]
  return port > 0 && port < 65535 && !(ip === '127.0.0.1' && port === self._port)
}
