define(function (require) {
'use strict';
var spv = require('spv');
var updateNesting = require('../../Model/updateNesting');
var pvUpdate = require('../../updateProxy').update;
var probeDiff = require('../../probeDiff');


var bindMMapStateChanges = function(store_md, md) {
  if (store_md.binded_models[md._provoda_id]) {
    return;
  }
  store_md.binded_models[md._provoda_id] = true;
};

var complexBrowsing = function(bwlev, md, value) {
  // map levels. without knowing which map
  var obj = md.state('bmp_show');
  obj = obj && spv.cloneObj({}, obj) || {};
  var num = bwlev.state('map_level_num');
  obj[num] = value;
  pvUpdate(md, 'bmp_show', obj);
};

var model_mapch = {
  'move-view': function(change, spg) {
    var md = change.target.getMD();
    var bwlev = change.bwlev.getMD();

    bindMMapStateChanges(spg, md);
    // debugger;

    if (change.value) {
      var parent = change.target.getMD().getParentMapModel();
      var bwlev_parent = change.bwlev.getMD().getParentMapModel();
      if (parent){
        pvUpdate(bwlev_parent, 'mp_has_focus', false);
        pvUpdate(parent, 'mp_has_focus', false);
      }
    }

    pvUpdate(bwlev, 'mpl_attached', !change.value);
    pvUpdate(md, 'mp_show', change.value);
    pvUpdate(bwlev, 'mp_show', change.value);
    complexBrowsing(bwlev, md,  change.value);
  },
  'zoom-out': function(change) {
    // debugger;
    var md = change.target.getMD();
    var bwlev = change.bwlev.getMD();
    pvUpdate(bwlev, 'mp_show', false);
    pvUpdate(md, 'mp_show', false);
    complexBrowsing(bwlev, md,  false);
  },
  'destroy': function(change) {
    var md = change.target.getMD();
    var bwlev = change.bwlev.getMD();
    pvUpdate(md, 'mp_show', false);
    pvUpdate(bwlev, 'mp_show', false);
    complexBrowsing(bwlev, md,  false);
  }
};

// var minDistance = function(obj) {
// 	if (!obj) {return;}
// 	var values = [];
// 	for (var key in obj) {
// 		if (!obj[key]) {
// 			continue;
// 		}
// 		values.push(obj[key]);
// 	}

// 	if (!values.length) {return;}

// 	return Math.min.apply(null, values);
// };


// var depthValue = function(obj_raw, key, value) {
// 	var obj = obj_raw && spv.cloneObj({}, obj_raw) || {};
// 	obj[key] = value;
// 	return obj;
// };

var goUp = function(bwlev, cb) {
  if (!bwlev) {return;}
  var count = 1;
  var md = bwlev.getNesting('pioneer');
  var cur = bwlev;
  while (cur) {
    cb(cur, md, count);
    cur = cur.map_parent;
    md = cur && cur.getNesting('pioneer');
    count++;
  }
};

var setDft = function(get_atom_value) {
  return function(bwlev, md, count) {
    var atom_value = get_atom_value(count);
    // var value = depthValue(md.state('bmp_dft'), bwlev._provoda_id, atom_value);
    // pvUpdate(md, 'bmp_dft', value);
    // pvUpdate(md, 'mp_dft', minDistance(value));
    pvUpdate(bwlev, 'mp_dft', atom_value);
  };
};

var dftCount = setDft(function(count) {
  return count;
});

var dftNull = setDft(function() {
  return null;
});

var depth = function(bwlev, old_bwlev) {
  goUp(old_bwlev, dftNull);
  goUp(bwlev, dftCount);
  return bwlev;
};

var getPioneer = function (bwlev) {
  return bwlev.getNesting('pioneer');
};

var branch = function (bwlev) {
  var list = [];
  var cur = bwlev;
  while (cur) {
    list.unshift(cur);
    cur = cur.map_parent;
  }
  return list;
}

var asMDR = function(md) {
  return md && md.getMDReplacer();
}

 function animateMapChanges(fake_spyglass, bwlev) {
 var diff = probeDiff(bwlev.getMDReplacer(), fake_spyglass.current_mp_bwlev && fake_spyglass.current_mp_bwlev.getMDReplacer());
 if (!diff.array || !diff.array.length) {
  return;
 }

  var bwlevs = branch(bwlev);
  var models = bwlevs.map(getPioneer);

  updateNesting(fake_spyglass, 'navigation', bwlevs);

  var app = fake_spyglass.app;
  var nav_tree = models;
  app.nav_tree = nav_tree;
  if (app.matchNav){
    app.matchNav();
  }



  var changes = diff;
  var i;
  var all_changhes = spv.filter(changes.array, 'changes');


  all_changhes = Array.prototype.concat.apply(Array.prototype, all_changhes);
  //var models = spv.filter(all_changhes, 'target');

  for (i = 0; i < all_changhes.length; i++) {
    var change = all_changhes[i];
    var handler = model_mapch[change.type];
    if (handler){
      handler.call(null, change, fake_spyglass);
    }
  }

  /*
    подсветить/заменить текущий источник
    проскроллить к источнику при отдалении
    просроллить к источнику при приближении
  */

  // var bwlevs = residents && spv.filter(residents, 'lev.bwlev');


  if (diff.target){
    if (fake_spyglass.current_mp_md) {
      pvUpdate(fake_spyglass.current_mp_md, 'mp_has_focus', false);
    }
    var target_md = fake_spyglass.current_mp_md = diff.target.getMD();

    fake_spyglass.current_mp_bwlev = depth(diff.bwlev.getMD(), fake_spyglass.current_mp_bwlev);

    pvUpdate(target_md, 'mp_has_focus', true);
    pvUpdate(diff.bwlev.getMD(), 'mp_has_focus', true);

    // pvUpdate(fake_spyglass, 'show_search_form', !!target_md.state('needs_search_from'));
    pvUpdate(fake_spyglass, 'full_page_need', !!target_md.full_page_need);
    updateNesting(fake_spyglass, 'current_mp_md', target_md);
    updateNesting(fake_spyglass, 'current_mp_bwlev', diff.bwlev.getMD());
    //pvUpdate(target_md, 'mp-highlight', false);


    // TODO: remove this legacy
    updateNesting(app, 'current_mp_md', target_md);
    // will be used for `imporant_models`
    // will be using in views for size check?
    pvUpdate(app, 'current_mp_bwlev', diff.bwlev.getMD());
    // will be used for `imporant_models`

  }


  var mp_show_wrap;
  if (models){

    var all_items = models.concat(bwlevs);

    mp_show_wrap = {
      items: models.map(asMDR),
      bwlevs: bwlevs.map(asMDR),
      all_items: all_items.map(asMDR),
      mp_show_states: []
    };
    for (i = 0; i < models.length; i++) {
      mp_show_wrap.mp_show_states.push(models[i].state('mp_show'));
    }
  }


  updateNesting(fake_spyglass, 'map_slice', {
    residents_struc: mp_show_wrap,
    transaction: changes
  });

};

function changeZoomSimple(bwlev, value_raw) {
  var value = Boolean(value_raw);
  pvUpdate(bwlev, 'mp_show', value);
  var md = bwlev.getNesting('pioneer');
  complexBrowsing(bwlev, md,  value);
};

animateMapChanges.switchCurrentBwlev = switchCurrentBwlev;

function switchCurrentBwlev(bwlev, prev) {
  if (prev) {
    changeZoomSimple(prev, false);
  }
  if (bwlev) {
    changeZoomSimple(bwlev, true);
  }

  depth(bwlev, prev);
}

return animateMapChanges;
});
