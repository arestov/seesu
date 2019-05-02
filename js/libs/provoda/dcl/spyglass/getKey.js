define(function(require) {
'use strict';
return function getKey(data) {
  var bwlev_key = data.bwlev ? ('-' + data.bwlev) : '';
  var md_key = data.context_md ? ('-' + data.context_md) : '';
  return data.name + bwlev_key + md_key;
};
});
