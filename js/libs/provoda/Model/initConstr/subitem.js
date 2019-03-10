define(function() {
'use strict'

return function initSi(Constr, parent_md, data, params, more, states) {
  if (Constr.prototype.conndst_parent && Constr.prototype.conndst_parent.length) {
    if (Constr.prototype.pconstr_id !== true && parent_md.constr_id !== Constr.prototype.pconstr_id) {
      console.log( (new Error('pconstr_id should match constr_id')).stack );
    }
  }

  if (Constr.prototype.init) {
    var instance = new Constr();
    var initsbi_opts = parent_md.getSiOpts();

    parent_md.useMotivator(instance, function(instance) {
      instance.init(initsbi_opts, data, params, more, states);
    });

    return instance;
  }

  var motivator = parent_md.current_motivator;

  var opts = {
    _motivator: motivator,
    map_parent: parent_md != parent_md.app && parent_md,
    app: parent_md.app
  };

  var instancePure = new Constr(opts, data, params, more, states);

  instancePure.current_motivator = null;

  return instancePure;
}
})
