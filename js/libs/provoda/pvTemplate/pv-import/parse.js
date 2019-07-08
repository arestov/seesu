define(function() {
'use strict';
return function parsePVImport(node, sample_name) {

  var possible = node.nodeName === 'SCRIPT'
    ? node
    : node.querySelector('script[type="pv-import-map"]');

  var script;
  if (possible === node) {
    script = node;
  }

  if (possible.parentNode === node) {
    script = node;
    node.removeChild(script);
  }
  var map_string = script && script.textContent
  var map = map_string ? JSON.parse(map_string) : [{}];

  return {
    sample_name: sample_name,
    map: map,
    pv_nest: script.getAttribute('pv-nest') || null
  };
};

});
