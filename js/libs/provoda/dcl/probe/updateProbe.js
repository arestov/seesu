define(function(require) {
'use strict';
 // var getSPByPathTemplate = function(app, start_md, string_template, need_constr, md_for_urldata) {
var spv = require('spv');
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate;
var getModelById = require('../../utils/getModelById');

var getProbeChange = function (toggle) {
  return function (bwlev, target_id, probe_name, value, probe_container_uri) {
    var app = bwlev.app;

    var target = getModelById(bwlev, target_id);
    var container = probe_container_uri ? getSPByPathTemplate(app, target, probe_container_uri) : target;
    var subpage = getSPByPathTemplate(app, container, value);


    var set = bwlev._run_probes[probe_name];
    var key = target_id;

    // var probe_mds = bwlev.getNesting(transportName(probe_name));
    var probe_md = spv.set.get(set, key);
    if (!probe_md) {
      return; // throw ?
    }

    if (!toggle) {
      probe_md.updateNesting('current_md', subpage);
      return;
    }

    var cur = probe_md.getNesting('current_md');
    if (cur === subpage) {
      probe_md.updateNesting('current_md', null);
    } else {
      probe_md.updateNesting('current_md', subpage);
    }
  };
};

var updateProbe = getProbeChange();
var toggleProbe = getProbeChange(true);
updateProbe.toggleProbe = toggleProbe;

return updateProbe;
});
