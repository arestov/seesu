// TODO: don't return offer when we're at capacity. the approach of not sending handshake
//       wastes webrtc connections which are a more limited resource

module.exports = Swarm

var debug = require('debug')('webtorrent-swarm')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var once = require('once')
var speedometer = require('speedometer')
var Wire = require('bittorrent-protocol')

var MAX_PEERS = 30
var HANDSHAKE_TIMEOUT = 25000

/**
 * Peer
 * A peer in the swarm. Comprised of a `SimplePeer` and a `Wire`.
 *
 * @param {Swarm} swarm
 * @param {stream.Duplex} stream a duplex stream to the remote peer
 * @param {string} id remote peerId
 */
function Peer (swarm, stream, id) {
  this.swarm = swarm
  this.stream = stream
  this.id = id

  var wire = this.wire = new Wire()
  this.timeout = null
  this.handshaked = false
  this.paused = true

  var destroy = once(function () {
    if (this.handshaked)
      this.swarm.wires.splice(this.swarm.wires.indexOf(this.wire), 1)
    this.destroy()
    this.swarm._drain()
    this.swarm._peers[this.id] = null
  }.bind(this))

  // Destroy the peer when the stream/wire is done or emits an error.
  stream.once('end', destroy)
  stream.once('error', destroy)
  stream.once('close', destroy)
  stream.once('finish', destroy)

  wire.once('end', destroy)
  wire.once('close', destroy)
  wire.once('error', destroy)
  wire.once('finish', destroy)

  wire.on('handshake', this._onHandshake.bind(this))

  // Duplex streaming magic!
  stream.pipe(wire).pipe(stream)
}

Peer.prototype.destroy = function () {
  debug('peer destroy')
  if (this.stream) this.stream.destroy()
  if (this.wire) this.wire.destroy()
  if (this.timeout) clearTimeout(this.timeout)
  this.stream = null
  this.wire = null
  this.timeout = null
}

/**
 * Send a handshake to the remote peer. This is called by _drain() when there is room
 * for a new peer in this swarm. Even if the remote peer sends us a handshake, we might
 * not send a return handshake. This is how we rate-limit when there are too many peers;
 * without a return handshake the remote peer won't start sending us data or piece
 * requests.
 */
Peer.prototype.handshake = function () {
  this.paused = false
  this.wire.handshake(this.swarm.infoHash, this.swarm.peerId, this.swarm.handshake)
  debug('sent handshake i %s p %s', this.swarm.infoHashHex, this.swarm.peerIdHex)

  if (!this.handshaked) {
    // Peer must respond to handshake in timely manner
    this.timeout = setTimeout(function () {
      this.destroy()
    }.bind(this), HANDSHAKE_TIMEOUT)
  }
}

/**
 * Called whenever we've handshaken with a new wire.
 * @param  {string} infoHash
 */
Peer.prototype._onHandshake = function (infoHash) {
  var infoHashHex = infoHash.toString('hex')
  debug('got handshake %s', infoHashHex)

  if (this.swarm.destroyed || infoHashHex !== this.swarm.infoHashHex)
    return this.destroy()

  this.handshaked = true
  clearTimeout(this.timeout)

  // Track total bytes downloaded by the swarm
  this.wire.on('download', function (downloaded) {
    this.swarm.downloaded += downloaded
    this.swarm.downloadSpeed(downloaded)
    this.swarm.emit('download', downloaded)
  }.bind(this))

  // Track total bytes uploaded by the swarm
  this.wire.on('upload', function (uploaded) {
    this.swarm.uploaded += uploaded
    this.swarm.uploadSpeed(uploaded)
    this.swarm.emit('upload', uploaded)
  }.bind(this))

  this.swarm.wires.push(this.wire)
  this.swarm.emit('wire', this.wire)
}

inherits(Swarm, EventEmitter)

/**
 * Swarm
 * =====
 * Abstraction of a BitTorrent "swarm", which is handy for managing all peer
 * connections for a given torrent download. This handles connecting to peers,
 * listening for incoming connections, and doing the initial peer wire protocol
 * handshake with peers. It also tracks total data uploaded/downloaded to/from
 * the swarm.
 *
 * Events: wire, download, upload, error, close
 *
 * @param {Buffer|string} infoHash
 * @param {Buffer|string} peerId
 * @param {Object} opts
 */
function Swarm (infoHash, peerId, opts) {
  if (!(this instanceof Swarm)) return new Swarm(infoHash, peerId, opts)
  EventEmitter.call(this)
  if (!opts) opts = {}

  this.infoHash = typeof infoHash === 'string'
    ? new Buffer(infoHash, 'hex')
    : infoHash
  this.infoHashHex = this.infoHash.toString('hex')

  this.peerId = typeof peerId === 'string'
    ? new Buffer(peerId, 'utf8')
    : peerId
  this.peerIdHex = this.peerId.toString('hex')

  debug('new swarm i %s p %s', this.infoHashHex, this.peerIdHex)

  this.handshake = opts.handshake // handshake extensions
  this.maxPeers = opts.maxPeers || MAX_PEERS

  this.downloaded = 0
  this.uploaded = 0
  this.downloadSpeed = speedometer()
  this.uploadSpeed = speedometer()

  this.wires = [] // open wires (added *after* handshake)
  this._queue = [] // queue of peers to attempt handshake with
  this._peers = {} // connected peers (peerId -> Peer)

  this.paused = false
  this.destroyed = false
}

Object.defineProperty(Swarm.prototype, 'ratio', {
  get: function () {
    if (this.downloaded === 0)
      return 0
    else
      return this.uploaded / this.downloaded
  }
})

Object.defineProperty(Swarm.prototype, 'numQueued', {
  get: function () {
    return this._queue.length
  }
})

Object.defineProperty(Swarm.prototype, 'numPeers', {
  get: function () {
    return this.wires.length
  }
})

/**
 * Add a peer to the swarm.
 * @param {SimplePeer} simplePeer     simple peer instance to remote peer
 * @param {string}     simplePeer.id  peer id
 */
Swarm.prototype.addPeer = function (simplePeer) {
  if (this.destroyed) return
  if (this._peers[simplePeer.id]) return
  var stream = simplePeer.getDataStream()
  var peer = new Peer(this, stream, simplePeer.id)
  this._peers[simplePeer.id] = peer
  this._queue.push(peer)
  this._drain()
}

/**
 * Temporarily stop connecting to new peers. Note that this does not pause new
 * incoming connections, nor does it pause the streams of existing connections
 * or their wires.
 */
Swarm.prototype.pause = function () {
  debug('pause')
  this.paused = true
}

/**
 * Resume connecting to new peers.
 */
Swarm.prototype.resume = function () {
  debug('resume')
  this.paused = false
  this._drain()
}

/**
 * Remove a peer from the swarm.
 * @param  {string} peer  simple-peer instance
 */
Swarm.prototype.removePeer = function (peer) {
  debug('removePeer %s', peer)
  this._removePeer(peer)
  this._drain()
}

/**
 * Private method to remove a peer from the swarm without calling _drain().
 * @param  {string} peer  simple-peer instance
 */
Swarm.prototype._removePeer = function (peer) {
  debug('_removePeer %s', peer)
  peer.destroy()
}

/**
 * Destroy the swarm, close all open peer connections, and do cleanup.
 * @param {function} onclose
 */
Swarm.prototype.destroy = function (onclose) {
  if (this.destroyed) return
  this.destroyed = true
  if (onclose) this.once('close', onclose)

  debug('destroy')

  for (var peer in this._peers) {
    this._removePeer(peer)
  }

  this.emit('close')
}

/**
 * Pop a peer off the FIFO queue and connect to it. When _drain() gets called,
 * the queue will usually have only one peer in it, except when there are too
 * many peers (over `this.maxPeers`) in which case they will just sit in the
 * queue until another connection closes.
 */
Swarm.prototype._drain = function () {
  if (this.paused || this.destroyed || this.numPeers >= this.maxPeers) return
  debug('drain %s queued %s peers %s max', this.numQueued, this.numPeers, this.maxPeers)
  var peer = this._queue.shift()
  if (peer) {
    peer.handshake()
  }
}
