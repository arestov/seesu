'use strict';

var Stream = require('stream');
var gutil = require('gulp-util');
var path = require('path');
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

module.exports = function (patch_path) {

  // if (!Array.isArray(processors)) {
  //   throw new gutil.PluginError('gulp-patch', 'Please provide array of posthtml processors!')
  // }

  var stream = new Stream.Transform({ objectMode: true });

  stream._transform = function (file, encoding, cb) {
    // console.log('bb');
    // gutil.log('gulp-patch:', file);
    // console.log(file)
    if (file.isStream()) {
      // return handleError('Streams are not supported!')
    }

    var source = file.contents.toString();

    fs.readFile(patch_path, function (err, patch) {
      if (err) {return console.error(err);}

      patch = patch.toString();
      // console.log(jsdiff.parsePatch(patch)[0].hunks);


      var result = jsdiff.applyPatch(source, patch.toString(), diff_options);

      if (!result) {
        return cb(new Error('gulp-patch error' + patch.toString()));
      }

      file.contents = new Buffer(result);

      setImmediate(function () {
        cb(null, file);
      });

      // fs.writeFile()
    });



  };

  return stream;
};
