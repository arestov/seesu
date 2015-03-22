var hat = require('hat')
var portfinder = require('portfinder')
var Swarm = require('../')
var test = require('tape')

var infoHash = 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36'
var peerId1 = new Buffer('-WW0001-' + hat(48), 'utf8').toString('hex')
var peerId2 = new Buffer('-WW0001-' + hat(48), 'utf8').toString('hex')

test('timeout if no handshake', function (t) {
  t.plan(3)

  var swarm1 = new Swarm(infoHash, peerId1)
  portfinder.getPort(function (err, port) {
    if (err) throw err
    swarm1.listen(port)

    var onincoming = swarm1._onincoming
    swarm1._onincoming = function (peer) {
      // Nuke the handshake function on swarm1's peer to test swarm2's
      // handshake timeout code
      peer.wire.handshake = function () {}
      onincoming.call(swarm1, peer)
    }

    swarm1.on('listening', function () {
      var swarm2 = new Swarm(infoHash, peerId2)

      swarm1.on('wire', function (wire) {
        t.ok(wire, 'Got wire via listening port')
        t.equal(swarm1.wires.length, 1)

        // swarm2 should never get a wire since swarm1 refuses to send it a
        // handshake
        t.equal(swarm2.wires.length, 0)

        swarm1.destroy()
        swarm2.destroy()
      })

      swarm2.on('wire', function (wire) {
        t.fail('Should not get a wire because peer did not handshake')
      })

      swarm2.addPeer('127.0.0.1:' + swarm1.port)
    })
  })
})
