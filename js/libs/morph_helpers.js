define(function(require) {
"use strict";

var getLFMImageWrap= require('./helpers/getLFMImageWrap')

return {
  num: function(value) {
    return parseFloat(value);
  },
  lfm_image: getLFMImageWrap,
  'seconds': function(value) {
    return value * 1000;
  },
  timestamp: function(value) {
    return value * 1000;
  },
  urlp: function(value) {
    return '/' + value;
  }
};
});
