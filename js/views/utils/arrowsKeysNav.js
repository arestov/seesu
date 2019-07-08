define(function () {
'use strict';

var inputs_names = {
  input: true,
};

var key_codes_map = {
  '13':    'Enter',
  '37':    'Left',
  '39':    'Right',
  '40':    'Down',
  '38':    'Up',
  '63233': 'Down',
  '63232': 'Up'
};

return function arrowsKeysNav(view, e) {
  var key_name = key_codes_map[e.keyCode];
  var allow_pd = !inputs_names.hasOwnProperty(e.target.nodeName.toLowerCase());

  if (key_name && allow_pd){
    e.preventDefault();
  }

  if (key_name){
    view.wp_box.wayPointsNav(key_name, e);
  }
};
})
