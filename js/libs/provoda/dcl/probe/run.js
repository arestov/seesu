define(function (require) {
'use strict';
var spv = require('spv');
var transportName = require('./transportName');
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate;

return function run(bwlev, pathp) {
  var md = pathp.md;
  if (!bwlev._run_probes) {
    bwlev._run_probes = {};
  }

  var app = bwlev.app;

  for (var name in md._probs) {
    if (!md._probs.hasOwnProperty(name)) {continue;}
    var cur = md._probs[name];

    if (!canCreateProbe(bwlev, pathp, cur)) {continue;}

    if (!bwlev._run_probes.hasOwnProperty(name)) {
      bwlev._run_probes[name] = spv.set.create();
    }

    var set = bwlev._run_probes[name];

    var key = md._provoda_id;

    // contains
    // get
    // add
    // remove

    if (spv.set.contains(set, key)) {continue;}

    var con = app.initChi('__probe', null, null, null, {
      path: pathp.path,
      name: cur.name,
      owner_provoda_id: md._provoda_id,
    });

    con.updateNesting('owner_bwlev', bwlev);

    var initial = cur.options && cur.options.initial;
    if (initial) {
      var subpage = getSPByPathTemplate(md.app, md, initial);
      con.updateNesting('current_md', subpage);
    }

    spv.set.add(set, key, con);

    bwlev.updateNesting(transportName(name), set.list);
  }
};


function canCreateProbe(bwlev, pathp, dcl) {
  if (typeof dcl.steps_to_surface_limit !== 'undefined') {
    if (pathp.path.length > dcl.steps_to_surface_limit) {
      return false
    }
  }

  return true;
}

});
