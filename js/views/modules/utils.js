define(function (require) {
'use strict';
var $ = require('jquery');

function verticalAlign(img, opts){
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

function preloadImage(src, alt, callback, place){
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

return {
  verticalAlign: verticalAlign,
	preloadImage: preloadImage,
}
})
