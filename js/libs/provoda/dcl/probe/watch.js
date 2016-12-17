define(function (require) {
'use strict';
var ProbesCollectors = function () {
  this.index = {};
  this.list = [];
};

var count = 0;

// какие зонды присутствуют в существующей структуре данных (построенной по схеме)?

// как они ограничеваются?
  // как много зондов можно поставить друг за другом?
  // как много однотипных зондов можно поставить друг за другом?
  // как грубоко от "поверхности" "среза" может находится зонд?
  // за каким "вложениями" может наблюдать зонд?

// как они делятся состоянием?
  // делиться во всех срезах?
  // делиться во всех вложениях?

return function watchAndCollectProbes(bwlev, md) {
  if (!md._probes_collectors) {
    md._probes_collectors = new ProbesCollectors();
  }

  collect(md._probes_collectors, bwlev);
};

function collect(collectors, bwlev) {
  if (collectors.index[bwlev._provoda_id]) {
    return;
  }
  collectors.index[bwlev._provoda_id] = bwlev;
  collectors.list.push(bwlev);
  console.log(count);
}

});
