define(function (require) {
'use strict';
var $ = require('jquery');

return function preloadImage(src, alt, callback, place){
  var image = window.document.createElement('img');
  if (alt){
    image.alt= alt;
  }

  image.onload = function(){
    if (callback){
      callback(image);
    }
  };
  if (place){
    $(place).append(image);
  }
  image.src = src;
  if (image.complete){
    setTimeout(function(){
      if (callback){
        callback(image);
      }
    }, 10);

  }
  return image;
}

});
