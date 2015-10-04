'use strict';
var gutil = require('gulp-util');
var plugin = require('./gulp-plugin');
var fs = require('fs');
var jsdiff = require('diff');

var diff_options = {
  compareLine: function (lineNumber, line, operation, patchContent) {
    var matched = line.replace(/\s+$/gi, '') === patchContent.replace(/\s+$/gi, '');
    if (!matched) {
      console.log('no patch match', lineNumber);
      console.log(line);
      console.log(patchContent);
      // throw new Error();
    }
    return matched;
  }
};
module.exports = plugin('gulp-patch', function(patch_path, file, encoding, cb) {
  var source = file.contents.toString();

  fs.readFile(patch_path, function (err, patch) {
    if (err) {return console.error(err);}

    patch = patch.toString();

    var result = jsdiff.applyPatch(source, patch.toString(), diff_options);

    if (!result) {
      return cb(new gutil.PluginError('gulp-patch', patch.toString()));
    }

    file.contents = new Buffer(result);

    setImmediate(function () {
      cb(null, file);
    });
  });
});
