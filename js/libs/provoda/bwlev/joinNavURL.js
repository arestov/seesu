define(function(require) {
'use strict';
var getNavGroups = require('./getNavGroups');

var joinSubtree = function(array){
  var url = "";
  for (var i = array.length - 1; i >= 0; i--) {
    var md = 	array[i];
    var url_part = md.state('url_part');
    // if (!url_part) {
    // 	throw new Error('must be url');
    // }
    url += url_part || '';
  }
  return url;
};

return function(nav) {
  if (!nav || !nav.length) {
    return null;
  }

  var url = '';


  var groups = getNavGroups(nav[ nav.length - 1 ]);

  /*
    /users/me/lfm:neighbours#3:/users/lfm:kolczyk0
  */

  var last = groups.pop();

  url += joinSubtree(last);


  for (var i = groups.length - 1; i >= 0; i--) {
    var distance = groups[i].length;
    url += '#';

    if (distance > 1) {
      url += distance + ':';
    }

    url += joinSubtree(groups[i]);
  }

  return url;
};
});
