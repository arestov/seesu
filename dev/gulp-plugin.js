'use strict';

var Stream = require('stream');
var gutil = require('gulp-util');

module.exports = function(name, callback) {
	return function(options) {
		var stream = new Stream.Transform({ objectMode: true });

	  stream._transform = function (file, encoding, done) {
	    if (file.isStream()) {
	      return done(new gutil.PluginError(name, 'Streams are not supported!'));
	    }

      var complete = function(err, result) {
	    	var error = err && (typeof err == 'string' ?
	    		new gutil.PluginError(name, err) : err);

	    	setImmediate(function() {
	    		done(error, result);
	    	});
	    }

	    var promise = callback.call(stream, options, file, encoding, complete);
      if (!promise || !promise.then) {
        return;
      }

      promise.then(function(result) {
          complete(null, result);
        }, function(err) {
          complete(err);
        }
      );


	  };
	  return stream;
	}
};
