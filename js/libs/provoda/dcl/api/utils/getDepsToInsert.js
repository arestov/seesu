define(function() {
'use strict'

var doCopy = function (item, self, typed_state_dcls) {
  for (var i = 0; i < item.compxes.length; i+=2) {
    var name = item.compxes[ i ];
    var deps = item.compxes[ i + 1 ];
    typed_state_dcls['compx'] = typed_state_dcls['compx'] || {};
    typed_state_dcls['compx'][name] = deps;
  }
};

return function getDepsToInsert (source, self, typed_state_dcls) {
  if (!source) {return;}

  for (var name in source) {
    if (!source.hasOwnProperty(name)) {continue;}

    var cur = source[name];
    if (!cur.compxes) {continue;}

    doCopy(cur, self, typed_state_dcls);
  }
};
})
