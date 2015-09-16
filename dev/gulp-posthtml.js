// https://github.com/postcss/gulp-postcss/blob/a268c05a328d41215970f2967ff6085917cc1fa8/index.js

var Stream = require('stream')
var posthtml = require('posthtml')
var applySourceMap = require('vinyl-sourcemaps-apply')
var gutil = require('gulp-util')
var path = require('path')


module.exports = function (processors, options) {

  if (!Array.isArray(processors)) {
    throw new gutil.PluginError('gulp-posthtml', 'Please provide array of posthtml processors!')
  }

  var stream = new Stream.Transform({ objectMode: true })

  stream._transform = function (file, encoding, cb) {
    console.log(file)
    if (file.isStream()) {
      return handleError('Streams are not supported!')
    }

    // Source map is disabled by default
    var opts = { map: false }
    var attr

    // Extend default options
    if (options) {
      for (attr in options) {
        if (options.hasOwnProperty(attr)) {
          opts[attr] = options[attr]
        }
      }
    }

    opts.from = file.path
    opts.to = opts.to || file.path

    // Generate separate source map for gulp-sourcemap
    if (file.sourceMap) {
      opts.map = { annotation: false }
    }

    posthtml(processors)
      .process(file.contents, opts)
      .then(handleResult, handleError)

    function handleResult (result) {
      var map
      var warnings = result.warnings && result.warnings().join('\n')

      file.contents = new Buffer(result.html)


      // Apply source map to the chain
      if (file.sourceMap) {
        map = result.map.toJSON()
        map.file = file.relative
        map.sources = [].map.call(map.sources, function (source) {
          return path.join(path.dirname(file.relative), source)
        })
        applySourceMap(file, map)
      }

      if (warnings) {
        gutil.log('gulp-posthtml:', file.relative + '\n' + warnings)
      }


      setImmediate(function () {
        cb(null, file)
      });
    }

    function handleError (error) {
      console.log(error);
      var errorOptions = { fileName: file.path }
      if (error.name === 'HTMLSyntaxError') {
        error = error.message + error.showSourceCode()
        errorOptions.showStack = false
      }
      // Prevent stream’s unhandled exception from
      // being suppressed by Promise
      setImmediate(function () {
        cb(new gutil.PluginError('gulp-posthtml', error))
      })
    }

  }

  return stream
}
