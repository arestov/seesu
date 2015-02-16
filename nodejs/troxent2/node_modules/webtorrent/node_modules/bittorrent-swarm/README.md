# bittorrent-swarm [![travis](https://img.shields.io/travis/feross/bittorrent-swarm.svg)](https://travis-ci.org/feross/bittorrent-swarm) [![npm](https://img.shields.io/npm/v/bittorrent-swarm.svg)](https://npmjs.org/package/bittorrent-swarm) [![gittip](https://img.shields.io/gittip/feross.svg)](https://www.gittip.com/feross/)

### Simple, robust, BitTorrent "swarm" implementation

This is a node.js abstraction of a BitTorrent "swarm", which is handy for
managing all peer connections for a given torrent download. This handles
connecting to peers, listening for incoming connections, and doing the initial
peer wire protocol handshake with peers. It also tracks total data
uploaded/downloaded to/from the swarm.

Also works in the browser with [browserify](http://browserify.org/) and
[chrome-net](https://github.com/feross/chrome-net)! This module is used by
[WebTorrent](https://github.com/feross/WebTorrent).

## install

```
npm install bittorrent-swarm
```

## methods

``` js
var Swarm = require('bittorrent-swarm')

var swarm = new Swarm(myInfoHash, myPeerId)

swarm.on('wire', function(wire) {
	// a relevant wire has appeared, see `bittorrent-protocol` for more info

	wire.on('unchoke', function() {
		// we are now unchoked
	})

	swarm.wires // <- list of all connected wires
});

swarm.addPeer('127.0.0.1:42442') // add a peer
swarm.removePeer('127.0.0.1:42244') // remove a peer
```

## license

MIT

This was originally forked from [peer-wire-swarm](https://github.com/mafintosh/peer-wire-swarm) which is also MIT licensed.
