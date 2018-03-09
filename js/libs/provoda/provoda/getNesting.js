define(function() {
'use strict';
return function getNesting(md, collection_name) {
  return md.children_models && md.children_models[collection_name];
};
});
