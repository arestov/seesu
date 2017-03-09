define(function(require) {
'use strict';
 // var getSPByPathTemplate = function(app, start_md, string_template, need_constr, md_for_urldata) {

var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate;
var transportName = require('./transportName');

var getProbeChange = function (toggle) {
  return function (target, bwlev_id, probe_name, value, probe_container_uri) {
    var app = target.app;
    var container = probe_container_uri ? getSPByPathTemplate(app, target, probe_container_uri) : target;
    var subpage = getSPByPathTemplate(app, container, value);

    var probe_mds = container.getNesting(transportName(probe_name));
    var probe_md = probe_mds && probe_mds[0];
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
