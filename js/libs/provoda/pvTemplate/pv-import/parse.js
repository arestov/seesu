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

  var map = script && JSON.parse(script.textContent);

  return {
    sample_name: sample_name,
    map: map,
    pv_nest: script.getAttribute('pv-nest') || null
  };
};

});
