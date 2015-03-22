module.exports = Server

var debug = require('debug')('webtorrent-tracker')
var EventEmitter = require('events').EventEmitter
var http = require('http')
var inherits = require('inherits')
var WebSocketServer = require('ws').Server

var MAX_ANNOUNCE_PEERS = 20

inherits(Server, EventEmitter)

/**
 * A WebTorrent tracker server.
 *
 * A "WebTorrent tracker" is an HTTP/WebSocket service which responds to requests from
 * WebTorrent/WebRTC clients. The requests include metrics from clients that help the
 * tracker keep overall statistics about the torrent. Unlike a traditional BitTorrent
 * tracker, a WebTorrent tracker maintains an open connection to each peer in a swarm.
 * This is necessary to facilitate the WebRTC signaling (peer introduction) process.
 *
 * @param {Object}  opts            options object
 * @param {Number}  opts.server     use existing http server
 * @param {Number}  opts.interval   interval in ms that clients should announce on
 */
function Server (opts) {
  var self = this
  if (!(self instanceof Server)) return new Server(opts)
  EventEmitter.call(self)
  opts = opts || {}

  self._intervalMs = opts.interval
    ? opts.interval / 1000
    : 10 * 60 // 10 min (in secs)

  debug('new server %s', JSON.stringify(opts))

  self.port = null
  self.torrents = {}

  self._httpServer = opts.server || http.createServer()
  self._httpServer.on('error', self._onError.bind(self))
  self._httpServer.on('listening', self._onListening.bind(self))

  self._socketServer = new WebSocketServer({ server: self._httpServer })
  self._socketServer.on('error', self._onError.bind(self))
  self._socketServer.on('connection', function (socket) {
    socket.id = null
    socket.infoHashes = []
    socket.onSend = self._onSocketSend.bind(self, socket)
    socket.on('message', self._onSocketMessage.bind(self, socket))
    socket.on('error', self._onSocketError.bind(self, socket))
    socket.on('close', self._onSocketClose.bind(self, socket))
  })
}

Server.prototype.listen = function (port, onlistening) {
  var self = this
  debug('listen %s', port)
  self.port = port
  if (onlistening) self.once('listening', onlistening)
  self._httpServer.listen(port)
}

Server.prototype.close = function (cb) {
  var self = this
  debug('close')
  self._httpServer.close(cb)
}

Server.prototype._onListening = function () {
  var self = this
  debug('listening %s', self.port)
  self.emit('listening', self.port)
}

Server.prototype._onError = function (err) {
  var self = this
  debug('error %s', err.message || err)
  self.emit('error', err)
}

Server.prototype.getSwarm = function (infoHash) {
  var self = this
  var binaryInfoHash = Buffer.isBuffer(infoHash)
    ? infoHash.toString('binary')
    : new Buffer(infoHash, 'hex').toString('binary')
  return self._getSwarm(binaryInfoHash)
}

Server.prototype._getSwarm = function (binaryInfoHash) {
  var self = this
  var swarm = self.torrents[binaryInfoHash]
  if (!swarm) {
    swarm = self.torrents[binaryInfoHash] = {
      complete: 0,
      incomplete: 0,
      peers: {}
    }
  }
  return swarm
}

Server.prototype._onSocketMessage = function (socket, data) {
  var self = this

  try {
    data = JSON.parse(data)
  } catch (err) {
    return error('invalid socket message')
  }

  var infoHash = typeof data.info_hash === 'string' && data.info_hash
  if (!infoHash || infoHash.length !== 20) return error('invalid info_hash')
  var infoHashHex = binaryToHex(infoHash)

  var peerId = typeof data.peer_id === 'string' && data.peer_id
  if (!peerId || peerId.length !== 20) return error('invalid peer_id')
  var peerIdHex = binaryToHex(peerId)

  var left = Number(data.left)

  debug('received %s from %s', JSON.stringify(data), peerIdHex)
  if (!socket.id) socket.id = peerId
  if (socket.infoHashes.indexOf(infoHash) === -1) socket.infoHashes.push(infoHash)

  var swarm = self._getSwarm(infoHash)
  var peer = swarm.peers[peerId]

  var start = function () {
    if (peer) {
      debug('unexpected `started` event from peer that is already in swarm')
      return update() // treat as an update
    }
    if (left === 0) swarm.complete += 1
    else swarm.incomplete += 1
    peer = swarm.peers[peerId] = {
      socket: socket,
      id: peerId
    }
    self.emit('start', peerId)
  }

  var stop = function () {
    if (!peer) {
      debug('unexpected `stopped` event from peer that is not in swarm')
      return // do nothing
    }
    if (peer.complete) swarm.complete -= 1
    else swarm.incomplete -= 1
    swarm.peers[peerId] = null
    self.emit('stop', peerId)
  }

  var complete = function () {
    if (!peer) {
      debug('unexpected `completed` event from peer that is not in swarm')
      return start() // treat as a start
    }
    if (peer.complete) {
      debug('unexpected `completed` event from peer that is already marked as completed')
      return // do nothing
    }
    swarm.complete += 1
    swarm.incomplete -= 1
    peer.complete = true
    self.emit('complete', peerId)
  }

  var update = function () {
    if (!peer) {
      debug('unexpected `update` event from peer that is not in swarm')
      return start() // treat as a start
    }
    self.emit('update', peerId)
  }

  switch (data.event) {
    case 'started':
      start()
      break
    case 'stopped':
      stop()
      break
    case 'completed':
      complete()
      break
    case '': case undefined: // update
      update()
      break
    default:
      return error('invalid event') // early return
  }

  if (left === 0 && peer) peer.complete = true

  var response = JSON.stringify({
    complete: swarm.complete,
    incomplete: swarm.incomplete,
    interval: self._intervalMs,
    info_hash: infoHash
  })

  socket.send(response, socket.onSend)
  debug('sent response %s to %s', response, peerIdHex)

  var numWant = Math.min(
    Number(data.offers && data.offers.length) || 0,
    MAX_ANNOUNCE_PEERS
  )
  if (numWant) {
    debug('got offers %s from %s', JSON.stringify(data.offers), peerIdHex)
    var peers = self._getPeers(swarm, numWant, peerId)
    debug('got %s peers from swarm %s', peers.length, infoHashHex)
    peers.forEach(function (peer, i) {
      peer.socket.send(JSON.stringify({
        offer: data.offers[i].offer,
        offer_id: data.offers[i].offer_id,
        peer_id: peerId,
        info_hash: infoHash
      }))
      debug('sent offer to %s from %s', binaryToHex(peer.id), peerIdHex)
    })
  }

  if (data.answer) {
    debug('got answer %s from %s', JSON.stringify(data.answer), peerIdHex)
    var toPeerId = typeof data.to_peer_id === 'string' && data.to_peer_id
    if (!toPeerId) return error('invalid `to_peer_id`')
    var toPeer = swarm.peers[toPeerId]
    if (!toPeer) return self.emit('warning', new Error('no peer with that `to_peer_id`'))

    toPeer.socket.send(JSON.stringify({
      answer: data.answer,
      offer_id: data.offer_id,
      peer_id: peerId,
      info_hash: infoHash
    }))
    debug('sent answer to %s from %s', binaryToHex(toPeer.id), peerIdHex)
  }

  function error (message) {
    debug('sent error %s', message)
    socket.send(JSON.stringify({
      'failure reason': message,
      info_hash: infoHash
    }), socket.onSend)
    // even though it's an error for the client, it's just a warning for the server.
    // don't crash the server because a client sent bad data :)
    self.emit('warning', new Error(message))
  }
}

// TODO: randomize the peers that are given out
Server.prototype._getPeers = function (swarm, numWant, fromPeerId) {
  var peers = []
  for (var peerId in swarm.peers) {
    if (peers.length >= numWant) break
    if (peerId === fromPeerId) continue // skip self
    var peer = swarm.peers[peerId]
    if (!peer) continue
    peers.push(peer) // ignore null values
  }
  return peers
}

Server.prototype._onSocketSend = function (socket, err) {
  var self = this
  if (err) {
    debug('Socket error %s', err.message)
    self.handleClose(socket)
  }
}

Server.prototype._onSocketClose = function (socket) {
  var self = this
  debug('on socket close')
  if (!socket.id || !socket.infoHashes) return

  socket.infoHashes.forEach(function (infoHash) {
    var swarm = self.torrents[infoHash]
    if (swarm) swarm.peers[socket.id] = null
  })
}

Server.prototype._onSocketError = function (socket, err) {
  var self = this
  debug('socket error %s', err.message || err)
  self.emit('warning', err)
  self._onSocketClose(socket)
}

function binaryToHex (id) {
  return new Buffer(id, 'binary').toString('hex')
}
