define(function (require) {
'use strict';
var run = require('./run');

var ProbesCollectors = function () {
  this.index = {};
  this.list = [];
};

// какие зонды присутствуют в существующей структуре данных (построенной по схеме)?

// как они ограничеваются?
  // как много зондов можно поставить друг за другом?
  // как много однотипных зондов можно поставить друг за другом?
  // как грубоко от "поверхности" "среза" может находится зонд?
  // за каким "вложениями" может наблюдать зонд?

// как они делятся состоянием?
  // делиться во всех срезах?
  // делиться во всех вложениях?

return function watchAndCollectProbes(bwlev, path_owner_md) {
  if (!path_owner_md._probes_collectors) {
    path_owner_md._probes_collectors = new ProbesCollectors();
  }

  collect(path_owner_md._probes_collectors, bwlev);

  if (!path_owner_md._collected_probes) {return;}

  for (var i = 0; i < path_owner_md._collected_probes.list.length; i++) {
    run(bwlev, path_owner_md._collected_probes.list[i]);
  }


};

function collect(collectors, bwlev) {
  if (collectors.index[bwlev._provoda_id]) {
    return;
  }
  collectors.index[bwlev._provoda_id] = bwlev;
  collectors.list.push(bwlev);
}

});
