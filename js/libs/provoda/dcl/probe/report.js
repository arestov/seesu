define(function (require) {
'use strict';
var spv = require('spv');
var add = spv.set.add;

var run = require('./run');
var PathParticipation =  require('../../Model/PathParticipation');

var CollectedProbes = function() {
  this.list = [];
  this.index = {};
}


function report(pathp) {
  var path_owner_md = pathp.owner;

  addProbe(pathp);

  if (!path_owner_md._probes_collectors) {return;}

  for (var i = 0; i < path_owner_md._probes_collectors.list.length; i++) {
    run(path_owner_md._probes_collectors.list[i], pathp);
  }

};

report.reportZeroPath = reportZeroPath;

function reportZeroPath(md) {
  if (!md._probs) {return;}
   var pathp = getFakePathp(md);
   addProbe(pathp);
}

function addProbe(pathp) {
  var path_owner_md = pathp.owner;

  if (!pathp.md._probs) {return;}

  if (!path_owner_md._collected_probes) {
    path_owner_md._collected_probes = new CollectedProbes();
  }

  add(path_owner_md._collected_probes, pathp.id, pathp);
}
function getFakePathp(md) {
  // we don't need PathParticipation here. but we need PathParticipation's structure here;
  return new PathParticipation(PathParticipation.zeroPath, md, md, -1);
}


return report;

});
