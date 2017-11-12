define(function(require) {
'use strict';
var spv = require('spv');
var pv = require('pv');
var $ = require('jquery');
var etc_views = require('./etc_views');
var View = require('View');
var loadImage = require('./utils/loadImage');

var pvUpdate = pv.update;

var SoftVkLoginUI = spv.inh(etc_views.VkLoginUI, {}, {
  createBase: function() {
    this._super();
    this.c.removeClass('attention-focuser');
  }
});



var ListPreview = spv.inh(View, {}, {
  useBase: function(node) {
    this.c = node;
    this.bindBase();
  },
  bindBase: function() {
    this.createTemplate();
    var _this = this;
    var button_area = spv.getTargetField(this, 'tpl.ancs.button_area') || this.c;
    button_area.click(function() {
      _this.requestPage();
    });

    this.addWayPoint(button_area);
  },
  'stch-list_loading': function(target, state) {
    if (!target.tpl.ancs.listc) {
      return;
    }
    target.tpl.ancs.listc.toggleClass('list_loading', !!state);
  },
  'stch-mp_show': function(target, state) {
    var node = spv.getTargetField(target, 'tpl.ancs.button_area') || target.c;
    node.toggleClass('button_selected', !!state);
  },
  base_tree: {
    sample_name: 'area_for_button'
  }
});

var ListPreviewLine = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'preview_line'
  },
  expandBase: function() {
    this.setVisState('img_allowed', this.extended_viewing);
  },
  'compx-selected_title': {
    depends_on: ['nav_title', 'nav_short_title'],
    fn: function(title, short_title) {
      return short_title || title;
    }
  }
});


var LiListsPreview = spv.inh(ListPreview, {}, {
  createBase: function() {
    this._super();
    this.c.addClass('tag_artists-preview');
  },
  children_views: {
    lists_list: ListPreviewLine
  },
  'collch-lists_list': 'tpl.ancs.listc'
});


var SPView = spv.inh(View, {}, {
  'compx-lvmp_show': [
    ['^vmp_show'],
    function(vmp_show) {
      return vmp_show;
    }
  ],
  'compx-mp_show_end': {
    depends_on: ['^mp_show_end'],
    fn: function(mp_show_end) {
      return mp_show_end;
    }
  }
});

var PageView = spv.inh(SPView, {}, {
  'stch-vmp_show': function(target, state) {
    target.c.toggleClass('hidden', !state);
  },
  createBase: function() {
    this.c = $('<div class="usual_page"></div>');
  }
});






var ArtistsListPreviewLine = spv.inh(ListPreviewLine, {}, {
  extended_viewing: true
});

var ListSimplePreview = spv.inh(ListPreview, {}, {
  children_views: {
    preview_list: ListPreviewLine

  },
  children_views_by_mn: {
    auth_part: {
      auth_block_lfm: etc_views.LfmLoginView,
      auth_block_vk: SoftVkLoginUI
    }
  },
  'stch-pmd_vswitched': function(target, state) {
    target.c.toggleClass('access-request', state);
  },
  'collch-preview_list': {
    place: 'tpl.ancs.listc',
    limit: 9
  },
/*	'collch-lists_list': {
    place: 'tpl.ancs.listc',
    limit: 9
  },*/
  'collch-auth_part': {
    place: 'tpl.ancs.auth_con',
    by_model_name: true
  }
});

var ImagedListPreview = spv.inh(ListSimplePreview, {}, {
  children_views: {
    preview_list: ArtistsListPreviewLine
  }
});

var ItemOfLL = spv.inh(ListPreview, {}, {
  children_views: {
    preview_list: ArtistsListPreviewLine,
    lists_list: ListPreviewLine
  },
  'collch-preview_list': {
    place: 'tpl.ancs.listc',
    limit: 9
  },
/*	'collch-lists_list': {
    place: 'tpl.ancs.listc',
    limit: 9
  }*/
});


var AuthListPreview = spv.inh(ImagedListPreview, {}, {
  base_tree: {
    sample_name: 'preview_area'
  }
});


var SimpleListOfListsView = spv.inh(PageView, {}, {
  base_tree: {
    sample_name: 'lilists'
  },
  children_views: {
    lists_list: ListSimplePreview
  },
  'collch-lists_list': 'tpl.ancs.lilists_con'
});

var ListOfListsView = spv.inh(PageView, {}, {
  base_tree: {
    sample_name: 'lilists'
  },
  children_views: {
    lists_list: AuthListPreview
  },
  'collch-lists_list': 'tpl.ancs.lilists_con'
});




var AlbumsListPreviewItem = spv.inh(View, {}, {
  createBase: function() {
    this.c = $('<img class="album_preview" src=""/>');
  },
  'stch-selected_image': function(target, lfm_wrap) {
    var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/126s/' + lfm_wrap.lfm_id : lfm_wrap.url;
    if (url){
      var node = target.c[0];
      var req = loadImage(target, {
        url: url,
        cache_allowed: true
      });
      req.then(function(){
        node.src = url;
      }, function(){
      });
      target.addRequest(req);
      target.on('die', function() {
        req.abort();
      });
    } else {
      target.c.attr('src', '');
    }
  }
});

var ImageLoader = spv.inh(View, {}, {
  'stch-selected_image': function(target, lfm_wrap) {
    var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/126s/' + lfm_wrap.lfm_id : lfm_wrap.url;
    if (url){
      pvUpdate(target, 'queued_image$loading', true);
      var req = loadImage(target, {
        url: url,
        cache_allowed: true
      });

      req.then(function(){
          pvUpdate(target, 'queued_image', lfm_wrap);
        }, function(){

        });

      req.then(anyway, anyway)

      function anyway(){
        pvUpdate(target, 'queued_image$loading', false);
      }

      target.addRequest(req);
      target.on('die', function() {
        req.abort();
      });
    } else {
      pvUpdate(target, 'queued_image', null);
    }
  }
});


var BigAlbumPreview = spv.inh(View, {}, {
  base_tree: {
    sample_name: 'album_preview-big'
  },

  'stch-selected_image': function(target, lfm_wrap) {
    var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/126s/' + lfm_wrap.lfm_id : lfm_wrap.url;
    if (url){
      var node = target.tpl.ancs.imgc[0];
      var req = loadImage(target, {
          url: url,
          cache_allowed: true
        });
      req.then(function(){
        node.src = url;
      });
      target.addRequest(req);
      target.on('die', function() {
        req.abort();
      });
    } else {
      target.tpl.ancs.imgc.attr('src', '');
    }
  }
});

var AlbumsListView = spv.inh(PageView, {}, {
  base_tree: {
    sample_name: 'albums_page'
  },
  children_views: {
    preview_list: BigAlbumPreview
  },
  'collch-preview_list': 'tpl.ancs.albums_list_c'

});

var AlbumsListPreview = spv.inh(ItemOfLL, {}, {
  createBase: function() {
    this._super();
    this.tpl.ancs.listc.addClass('albums_previews');
  },
  children_views: {
    preview_list: AlbumsListPreviewItem
  },
  'collch-preview_list': {
    place: 'tpl.ancs.listc',
    limit: 15
  }
});


var tagListChange = function(target, array) {
  target.tpl.ancs.listc.empty();
  var df = window.document.createDocumentFragment();
  for (var i = 0; i < array.length; i++) {
    $(df).append(target.createTagLink(array[i].name));
    $(df).append(window.document.createTextNode(" "));
  }
  target.tpl.ancs.listc.append(df);
};
var TagsListPreview = spv.inh(ListPreview, {}, {
  'stch-simple_tags_list': tagListChange,
  createTagLink: function(name) {
    return $('<span></span>').text(name);
  }
});



var VKPostsView = spv.inh(PageView, {}, {
  base_tree: {
    sample_name: 'vk_posts_page'
  }
});

var AppNewsView = spv.inh(PageView, {}, {
  base_tree: {
    sample_name: 'app-news'
  }
});
return {
  ImageLoader:ImageLoader,
  ListPreview:ListPreview,
  LiListsPreview:LiListsPreview,
  ListPreviewLine:ListPreviewLine,
  SPView: SPView,
  PageView:PageView,
  ArtistsListPreviewLine: ArtistsListPreviewLine,
  ItemOfLL:ItemOfLL,
  SimpleListOfListsView: SimpleListOfListsView,
  ListOfListsView:ListOfListsView,
  AlbumsListPreviewItem:AlbumsListPreviewItem,
  BigAlbumPreview:BigAlbumPreview,
  AlbumsListView:AlbumsListView,
  AlbumsListPreview:AlbumsListPreview,
  TagsListPreview: TagsListPreview,
  ListSimplePreview: ListSimplePreview,
  ImagedListPreview: ImagedListPreview,
  VKPostsView: VKPostsView,
  AppNewsView: AppNewsView,
  SoftVkLoginUI: SoftVkLoginUI
};

});
