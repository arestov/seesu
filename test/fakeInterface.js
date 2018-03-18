module.exports = function() {
  'use strict'
  return {
    source_name: 'fake',
    errors_fields: [],
    get: function() {
      var p = Promise.resolve({bio: 'was born'});
      p.abort = function() {};

      return p;
    }
  }
};
