# load-ip-set [![travis](https://img.shields.io/travis/feross/load-ip-set.svg)](https://travis-ci.org/feross/load-ip-set) [![npm](https://img.shields.io/npm/v/load-ip-set.svg)](https://npmjs.org/package/load-ip-set) [![downloads](https://img.shields.io/npm/dm/load-ip-set.svg)](https://npmjs.org/package/load-ip-set) [![gittip](https://img.shields.io/gittip/feross.svg)](https://www.gittip.com/feross/)

#### download and parse ip-set (blocklist) files

This module is used by [WebTorrent](http://webtorrent.io)!

### install

```
npm install load-ip-set
```

### usage

Given one of the following:

- http/https url (gzip, deflate, or no compression)
- filesystem path (gzip, or no compression)
- array of ip addresses or `{ start: '1.2.3.0', end: '1.2.3.255' }` ip ranges

this module loads the ip set (downloading from the network, if necessary) and returns an [ip-set](https://www.npmjs.org/package/ip-set) object. An `ip-set` is just a mutable set data structure optimized for use with IPv4 and IPv6 addresses.

```js
var loadIPSet = require('load-ip-set')
loadIPSet('http://example.com/list.txt', function (err, ipSet) {
  if (err) throw err
  ipSet.contains('1.2.3.4') //=> true
  ipSet.contains('2.2.2.2') //=> false
})
```

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
