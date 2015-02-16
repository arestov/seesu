var fs = require('fs')
var http = require('http')
var loadIPSet = require('../')
var portfinder = require('portfinder')
var test = require('tape')
var zlib = require('zlib')

test('array', function (t) {
  t.plan(5)
  loadIPSet([ '1.2.3.4' ], function (err, ipSet) {
    if (err) throw err
    t.ok(ipSet.contains('1.2.3.4'))
    t.ok(!ipSet.contains('1.1.1.1'))
  })
  loadIPSet([ '1.2.3.4', '5.6.7.8' ], function (err, ipSet) {
    if (err) throw err
    t.ok(ipSet.contains('1.2.3.4'))
    t.ok(ipSet.contains('5.6.7.8'))
    t.ok(!ipSet.contains('1.1.1.1'))
  })
})

function checkList (t, ipSet) {
  t.ok(ipSet.contains('1.2.3.0'))
  t.ok(ipSet.contains('1.2.3.1'))
  t.ok(ipSet.contains('1.2.3.254'))
  t.ok(ipSet.contains('1.2.3.255'))
  t.ok(ipSet.contains('5.6.7.0'))
  t.ok(ipSet.contains('5.6.7.128'))
  t.ok(ipSet.contains('5.6.7.255'))
  t.ok(!ipSet.contains('1.1.1.1'))
  t.ok(!ipSet.contains('2.2.2.2'))
}

test('http url', function (t) {
  t.plan(9)
  var server = http.createServer(function (req, res) {
    fs.createReadStream(__dirname + '/list.txt')
      .pipe(res)
  })
  portfinder.getPort(function (err, port) {
    if (err) throw err
    var url = 'http://127.0.0.1:' + port
    server.listen(port, function () {
      loadIPSet(url, function (err, ipSet) {
        if (err) throw err
        checkList(t, ipSet)
        server.close()
      })
    })
  })
})

test('http url with gzip encoding', function (t) {
  t.plan(9)
  var server = http.createServer(function (req, res) {
    res.setHeader('content-encoding', 'gzip')
    fs.createReadStream(__dirname + '/list.txt')
      .pipe(zlib.createGzip())
      .pipe(res)
  })
  portfinder.getPort(function (err, port) {
    if (err) throw err
    var url = 'http://127.0.0.1:' + port
    server.listen(port, function () {
      loadIPSet(url, function (err, ipSet) {
        if (err) throw err
        checkList(t, ipSet)
        server.close()
      })
    })
  })
})

test('http url with deflate encoding', function (t) {
  t.plan(9)
  var server = http.createServer(function (req, res) {
    res.setHeader('content-encoding', 'deflate')
    fs.createReadStream(__dirname + '/list.txt')
      .pipe(zlib.createDeflate())
      .pipe(res)
  })
  portfinder.getPort(function (err, port) {
    if (err) throw err
    var url = 'http://127.0.0.1:' + port
    server.listen(port, function () {
      loadIPSet(url, function (err, ipSet) {
        if (err) throw err
        checkList(t, ipSet)
        server.close()
      })
    })
  })
})

test('fs path', function (t) {
  t.plan(9)
  loadIPSet(__dirname + '/list.txt', function (err, ipSet) {
    if (err) throw err
    checkList(t, ipSet)
  })
})

test('fs path with gzip', function (t) {
  t.plan(9)
  loadIPSet(__dirname + '/list.txt.gz', function (err, ipSet) {
    if (err) throw err
    checkList(t, ipSet)
  })
})
