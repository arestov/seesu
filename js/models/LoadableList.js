define(function(require) {
'use strict';
var LoadableListBase = require('pv/LoadableList');
var spv = require('spv');
var pv = require('pv');
var pvUpdate = require('pv/update');

var LoadableList = spv.inh(LoadableListBase, {
  naming: function(fn) {
    return function LoadableList(arg1, arg2, arg3, arg4, arg5, arg6) {
      fn(this, arg1, arg2, arg3, arg4, arg5, arg6);
    };
  },
  props: {}
});

var TagsList = spv.inh(LoadableList, {}, {
  "+states": {
    "simple_tags_list": [
      "compx",
      ['tags_list', 'preview_list'],
      function(tag_list, preview_list){
        return tag_list || preview_list;
      }
    ]
  },

  model_name: 'tagslist',
  main_list_name: 'tags_list',

  addTag: function(name, silent) {
    var main_list = this.getMainlist();
    main_list.push(name);

    if (!silent){
      //pv.updateNesting(this, this.main_list_name, main_list);
      pvUpdate(this, this.main_list_name, [].concat(main_list));
    }
  },

  dataListChange: function() {
    var main_list = this.getMainlist();
    pvUpdate(this, this.main_list_name, [].concat(main_list));

  },

  addItemToDatalist: function(obj, silent) {
    this.addTag(obj, silent);
  },

  setPreview: function(list) {
    pvUpdate(this, 'preview_list', list);
  },
});
LoadableList.TagsList = TagsList;

return LoadableList;
});
