define(function (require) {
'use strict';
var $ = require('jquery');

return function verticalAlign(img, opts){
  //target_height, fix
  var real_height = opts.real_height || (img.naturalHeight ||  img.height);
  if (real_height){
    var offset = (opts.target_height - real_height)/2;

    if (offset){
      if (opts.animate){
        $(img).animate({'margin-top':  offset + 'px'}, opts.animate_time || 200);
      } else {
        $(img).css({'margin-top':  offset + 'px'});
      }

    }
    return offset;
  }
}

});
