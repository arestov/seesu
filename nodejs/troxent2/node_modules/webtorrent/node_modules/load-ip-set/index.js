var fs = require('fs')
var hh = require('http-https')
var ipSet = require('ip-set')
var once = require('once')
var split = require('split')
var url = require('url')
var zlib = require('zlib')

var blocklistRe = /^\s*[^#].*?\s*:\s*([a-f0-9.:]+?)\s*-\s*([a-f0-9.:]+?)\s*$/

module.exports = function loadIPSet (input, cb) {
  cb = once(cb)
  if (Array.isArray(input) || !input) {
    process.nextTick(function () {
      cb(null, new ipSet(input))
    })
  } else if (/^https?:\/\//.test(input)) {
    var p = url.parse(input)
    var opts = {
      hostname: p.hostname,
      port: p.port,
      path: p.path,
      headers: {
        'accept-encoding': 'gzip, deflate'
      }
    }
    hh.get(opts, function (res) {
      res.on('error', cb)
      var encoding = res.headers['content-encoding']
      if (encoding === 'gzip') {
        onStream(res.pipe(zlib.Gunzip()))
      } else if (encoding === 'deflate') {
        onStream(res.pipe(zlib.createInflate().on('error', cb)))
      } else
        onStream(res)
    }).on('error', cb)
  } else {
    var f = fs.createReadStream(input).on('error', cb)
    if (/.gz$/.test(input))
      f = f.pipe(zlib.Gunzip().on('error', cb))
    onStream(f)
  }

  function onStream (stream) {
    var blocklist = []
    stream
      .pipe(split())
      .on('data', function (line) {
        var match = blocklistRe.exec(line)
        if (match) blocklist.push({ start: match[1], end: match[2] })
      })
      .on('end', function () {
        cb(null, new ipSet(blocklist))
      })
  }
}
