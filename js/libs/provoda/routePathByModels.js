define(function (require) {
'use strict';
var spv = require('spv');
var cloneObj = spv.cloneObj;
var morph_helpers = require('js/libs/morph_helpers');
var getSPI = getterSPI();
var getSPIConstr = getterSPIConstr();

var routePathByModels = function routePathByModels(start_md, pth_string, need_constr, strict, options) {

  if (!pth_string) {
    throw new Error('Empty path can\'t be used. Use / to get start page')
  }
  /*
  catalog
  users
  tags
  */


  /*
  #/catalog/The+Killers/_/Try me
  #?q=be/tags/beautiful
  #/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Phone+Call
  #/catalog/Varios+Artist/Eternal+Sunshine+of+the+spotless+mind/Beastie+boys/Phone+Call
  #/catalog/The+Killers/+similar/Beastie+boys/Phone+Call
  #/recommendations/Beastie+boys/Phone+Call
  #/loved/Beastie+boys/Phone+Call
  #/radio/artist/The+Killers/similarartist/Bestie+Boys/Intergalactic
  #?q=be/directsearch/vk/345345
  #/ds/vk/25325_2344446
  http://www.lastfm.ru/music/65daysofstatic/+similar
  */
  var cleanPath = pth_string.replace(/^\//, '').replace(/([^\/])\+/g, '$1 ');/*.replace(/^\//,'')*/
  if (!cleanPath) {
    return start_md;
  }
  var pth = cleanPath.split('/');

  var cur_md = start_md;
  var result = null;
  var tree_parts_group = null;
  for (var i = 0; i < pth.length; i++) {
    var types = spv.getTargetField(cur_md, '_sub_pager.type');
    if (types && types[pth[i]]){
      if (!tree_parts_group){
        tree_parts_group = [];
      }
      tree_parts_group.push(pth[i]);
      continue;
    }

    var path_full_string;
    if (tree_parts_group){
      path_full_string = [].concat(tree_parts_group, [pth[i]]).join('/');
    } else {
      path_full_string = pth[i];
    }
    tree_parts_group = null;

    if (need_constr) {
      var Constr = getSPIConstr(cur_md, path_full_string);
      if (!Constr) {
        throw new Error('you must use supported path');
      } else {
        cur_md = Constr.prototype;
        result = Constr;
      }
      continue;
    }

    var md = getSPI(cur_md, path_full_string, options);
    if (md){
      cur_md = md;
      result = md;
    } else if (strict) {
      return null;
    } else {
      break;
    }
  }

  return result;
}

function slash(str) {
  return str.split('/');
}

function subPageType(type_obj, parts) {
  var target = type_obj[decodeURIComponent(parts[0])];
  if (typeof target !== 'function') {
    return target || null;
  }

  return target(parts[1]);
}

function selectRouteItem(self, sp_name) {
  if (self._sub_pages && self._sub_pages[sp_name]) {
    return self._sub_pages[sp_name];
  }

  var sub_pager = self._sub_pager;
  if (sub_pager) {
    if (sub_pager.item) {
      return sub_pager.item;
    } else {
      var types = sub_pager.by_type;
      var type = subPageType(sub_pager.type, slash(sp_name));
      if (type && !types[type]) {
        throw new Error('unexpected type: ' + type + ', expecting: ' + Object.keys(type));
      }
      if (type) {
        return sub_pager.by_type[type];
      }
    }
  }

  if (self.subPager){
    console.warn('`subPager` is legacy. (there is no proper way to get `constr`, only `instance`). so get rid of `subPager`');
  }
}

function getSPOpts(md, sp_name, slashed, byType) {
  var normal_part = byType ? slashed.slice(1) : slashed;
  var by_colon = normal_part[0].split(':').map(decodeURIComponent);
  var by_comma = normal_part[0].split(',').map(decodeURIComponent);
  var by_slash = normal_part.map(decodeURIComponent);
  return [
    {
      url_part: '/' + sp_name
    },
    {
      simple_name: sp_name,
      decoded_name: decodeURIComponent(sp_name),
      name_spaced: by_colon[1],
      by_comma: by_comma,
      by_colon: by_colon,
      by_slash: by_slash,
    }];
};

function getInitData(md, common_opts) {
  var pre_instance_data = {};

  var data_parts = [
    common_opts && common_opts[0]
  ];

  for (var i = 0; i < data_parts.length; i++) {
    if (!data_parts[i]) {
      continue;
    }
    cloneObj(pre_instance_data, data_parts[i]);
  }

  return pre_instance_data;
};


function getterSPI(){
  var init = function(parent, target, data) {
    if (target.hasOwnProperty('_provoda_id')) {
      return target;
    }
    parent.useMotivator(target, function(instance) {
      instance.init(parent.getSiOpts(), data);
    });
    return target;
  };

  var prepare = function(self, item, sp_name, slashed) {
    var Constr = self._all_chi[item.key];
    /*

    берем данные из родителя
    накладываем стандартные данные
    накладываем данные из урла
    */

    var common_opts = getSPOpts(self, sp_name, slashed, item.byType);

    var instance_data = getInitData(self, common_opts);
    var hbu_declr = item.getHead;
    var head_by_urlname = hbu_declr && hbu_declr(common_opts[1], null, morph_helpers);
    if (head_by_urlname) {
      instance_data.head = head_by_urlname;
    }

    return self.initSi(Constr, instance_data, null, null, common_opts[0]);
  };

  return function getSPI(self, sp_name, options) {
    var reuse = options && options.reuse;

    var item = selectRouteItem(self, sp_name);
    if (item) {
      var can_be_reusable = item.can_be_reusable;
      if (reuse && can_be_reusable && self._last_subpages[item.key]) {
        var instance = self._last_subpages[item.key];
        if (instance.state('$$reusable_url')) {
          return instance;
        }
      }

      var getKey = item.getKey;
      var key = getKey ? getKey(decodeURIComponent(sp_name), sp_name) : sp_name;

      if (self.sub_pages && self.sub_pages[key]) {
        return self.sub_pages[key];
      }

      var instance = item && prepare(self, item, sp_name, slash(sp_name));
      if (instance) {
        watchSubPageKey(self, instance, key);
        self.sub_pages[key] = instance;
        if (can_be_reusable) {
          self._last_subpages[item.key] = instance;
        }
        return instance;
      }
    }

    if (self.subPager){
      if (self.sub_pages[sp_name]) {
        return self.sub_pages[sp_name];
      }

      var sub_page = self.subPager(decodeURIComponent(sp_name), sp_name);
      var instance = Array.isArray(sub_page)
        ? init(self, sub_page[0], sub_page[1])
        : sub_page;

      self.sub_pages[sp_name] = instance;
      watchSubPageKey(self, instance, sp_name);
      return instance;

    }
  };
}

function getterSPIConstr(){
  return function(self, sp_name) {
    var item = selectRouteItem(self, sp_name);
    if (item) {
      return self._all_chi[item.key];
    }

    if (self.subPager){
      var result = self.getSPC(decodeURIComponent(sp_name), sp_name);
      if (Array.isArray(result)) {
        return result[0];
      } else {
        return result;
      }
    }
  };
}

function watchSubPageKey(self, instance, key) {
  if (!instance.hasComplexStateFn('url_part')) {
    return;
  }

  var cur_key = key;

  self.lwch(instance, 'url_part', function(value) {
    if (self.sub_pages[cur_key] === instance) {
      self.sub_pages[cur_key] = null;
    }
    self.sub_pages[value] = instance;
    cur_key = value;
  });

}

routePathByModels.getSPI = getSPI;
routePathByModels.getSPIConstr = getSPIConstr;
return routePathByModels;
});
