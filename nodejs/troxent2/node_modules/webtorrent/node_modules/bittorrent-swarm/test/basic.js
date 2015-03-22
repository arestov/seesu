var hat = require('hat')
var portfinder = require('portfinder')
var Swarm = require('../')
var test = require('tape')

var infoHash = 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36'
var infoHash2 = 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa37'
var peerId = new Buffer('-WW0001-' + hat(48), 'utf8').toString('hex')
var peerId2 = new Buffer('-WW0001-' + hat(48), 'utf8').toString('hex')

test('create swarm, check invariants', function (t) {
  var swarm = new Swarm(infoHash, peerId)

  t.equal(swarm.infoHash.toString('hex'), infoHash)
  t.equal(swarm.peerId.toString('hex'), peerId)
  t.equal(swarm.downloaded, 0)
  t.equal(swarm.uploaded, 0)
  t.ok(Array.isArray(swarm.wires))
  t.equal(swarm.wires.length, 0)
  t.end()
})

test('swarm listen', function (t) {
  t.plan(2)

  var swarm = new Swarm(infoHash, peerId)
  t.equal(swarm.port, 0, 'port param initialized to 0')
  portfinder.getPort(function (err, port) {
    if (err) throw err
    swarm.listen(port)

    swarm.on('listening', function () {
      t.equal(swarm.port, port, 'listened on requested port ' + port)
      swarm.destroy()
    })
  })
})

test('two swarms listen on same port (explicit)', function (t) {
  t.plan(6)

  var swarm = new Swarm(infoHash, peerId)
  t.equal(swarm.port, 0, 'port param initialized to 0')
  portfinder.getPort(function (err, port) {
    if (err) throw err
    swarm.listen(port)

    swarm.on('listening', function (portReceived) {
      t.equal(swarm.port, portReceived, 'port property matches event port')
      t.equal(swarm.port, port, 'listened on requested port ' + port)

      var swarm2 = new Swarm(infoHash2, peerId)
      t.equal(swarm2.port, 0, 'port param initialized to 0')
      swarm2.listen(port)
      swarm2.on('listening', function (portReceived) {
        t.equal(swarm2.port, portReceived, 'port property matches event port')
        t.equal(swarm2.port, port, 'listened on requested port ' + port)
        swarm.destroy()
        swarm2.destroy()
      })
    })
  })
})

test('two swarms listen on same port (implicit)', function (t) {
  t.plan(5)

  // When no port is specified and listen is called twice, they should get assigned the same port.

  var swarm = new Swarm(infoHash, peerId)
  var swarm2 = new Swarm(infoHash2, peerId2)
  t.equal(swarm.port, 0, 'port param initialized to 0')
  t.equal(swarm2.port, 0, 'port param initialized to 0')

  function maybeDone () {
    if (swarm.listening && swarm2.listening) {
      t.equal(swarm.port, swarm2.port, 'swarms were given same port')
      swarm.destroy()
      swarm2.destroy()
    }
  }

  swarm.listen(function (port) {
    t.ok(port > 1024, 'listening on port above 1024')
    maybeDone()
  })

  swarm2.listen(function (port2) {
    t.ok(port2 > 1024, 'listening on port above 1024')
    maybeDone()
  })
})

test('swarm join', function (t) {
  t.plan(10)

  var swarm1 = new Swarm(infoHash, peerId)
  portfinder.getPort(function (err, port) {
    if (err) throw err
    swarm1.listen(port)

    swarm1.on('listening', function () {
      var swarm2 = new Swarm(infoHash, peerId2)

      t.equal(swarm1.wires.length, 0)
      t.equal(swarm2.wires.length, 0)

      swarm2.addPeer('127.0.0.1:' + swarm1.port)

      swarm1.on('wire', function (wire) {
        t.ok(wire, 'Peer join our swarm via listening port')

        t.equal(swarm1.wires.length, 1)
        t.ok(/127\.0\.0\.1:\d{1,5}/.test(wire.remoteAddress))
        t.equal(wire.peerId.toString('hex'), peerId2)

        swarm1.destroy()
      })

      swarm2.on('wire', function (wire) {
        t.ok(wire, 'Joined swarm, got wire')

        t.equal(swarm2.wires.length, 1)
        t.ok(/127\.0\.0\.1:\d{1,5}/.test(wire.remoteAddress))
        t.equal(wire.peerId.toString('hex'), peerId)

        swarm2.destroy()
      })
    })
  })
})
