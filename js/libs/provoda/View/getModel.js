define(function() {
'use strict';

return function getModel(view, _provoda_id) {
  var proxies_space = view.proxies_space || view.root_view.proxies_space;
  if (view._highway.views_proxies) {
    var mpx = view._highway.views_proxies.spaces[proxies_space].mpxes_index[_provoda_id]
    return mpx.md;
  }

  return view._highway.sync_r.models_index[_provoda_id]
}

})
