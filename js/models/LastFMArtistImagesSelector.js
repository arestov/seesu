define(function(require) {
'use strict'
var pv = require('pv');
var spv = require('spv');
var getImageWrap = require('js/libs/helpers/getLFMImageWrap')
var pvUpdate = require('pv/update');


var ImagesPack = spv.inh(pv.Model, {
  init: function(target) {
    target.images_by_source = {};
    target.all_images = [];
  }
}, {
  addImage: function(lfm_arr, source) {
    if (!this.images_by_source[source] && lfm_arr){
      this.images_by_source[source] = lfm_arr;
      this.all_images.push({
        data: lfm_arr,
        source: source
      });
      this.checkImages();
    }
  },
  checkImages: function() {
    var best_data = spv.filter(this.all_images, 'data.lfm_id', function(value) {
      return !!value;
    });
    if (!this.state('best_image')){
      if (best_data.length){
        pvUpdate(this, 'best_image', best_data[0].data);
      }

    }
    if (!this.state('just_image')){
      if (best_data.not.length){
        pvUpdate(this, 'just_image', best_data.not[0].data);
      }

    }
  }
});

var TrackImages  = spv.inh(ImagesPack, {
  init: function(target, opts, data, params) {
    target.artmd = params.artmd;
    target.artist = params.info.artist;
    target.track = params.info.track;

    // results is state
    target.wlch(params.artmd, 'image-to-use', 'artist_image');
  }
}, {
  "+states": {
    "image-to-use": [
      "compx",
      ['best_image', 'just_image', 'artist_image'],
      function(bei, jui, arti){
        return bei || jui || arti;
      }
    ]
  }
});

var ArtistImages = spv.inh(ImagesPack, {
  init: function(target, opts, data, params) {
    target.artist_name = params.artist_name;
  }
}, {
  "+states": {
    "image-to-use": [
      "compx",
      ['best_image', 'just_image'],
      function(bei, jui){
        return bei || jui;
      }
    ]
  }
});


var LastFMArtistImagesSelector = spv.inh(pv.Model, {
  init: function(target) {
    target.art_models = {};
    target.track_models = {};
    target.unknown_methods = {};
  }
}, {
  convertEventName: function(event_name) {
    return event_name.toLowerCase().replace(/^\s+|\s+$/, '');
  },
  getImageRewrap: function(obj) {
    if (!obj.array && !obj.item){
      return;
    }
    return getImageWrap(obj.array || obj.item);
  },
  setArtistImage: function(artist_name, lfm_arr, source) {
    this.getArtistImagesModel(artist_name).addImage(getImageWrap(lfm_arr), source);
  },
  setTrackImage: function(info, lfm_arr, source) {

    this.getTrackImagesModel(info).addImage(getImageWrap(lfm_arr), source);
  },
  setImage: function(info, source) {
    if (!info.artist){
      throw new Error('give me artist name');
    }
    if (!source){
      throw new Error('give me source');
    }
  },
  getTrackImagesModel: function(info) {
    if (!info.artist || !info.track){
      throw new Error ('give me full track info');
    }
    info = spv.cloneObj({}, info);

    info.artist = this.convertEventName(info.artist);
    info.track = this.convertEventName(info.track);

    var model_id = info.artist + ' - ' + info.track;
    if (!this.track_models[model_id]) {
      var md = this.initChi('track', false, {
        artmd: this.getArtistImagesModel(info.artist),
        info: info
      });

      this.track_models[model_id] = md;
    }
    return this.track_models[model_id];
  },
  'chi-track': TrackImages,
  'chi-artist': ArtistImages,
  getArtistImagesModel: function(artist_name) {
    if (!artist_name){
      throw new Error('give me artist name');
    }
    artist_name = this.convertEventName(artist_name);

    if (!this.art_models[artist_name]){
      var md = this.initChi('artist', false, {
        artist_name: artist_name
      });
      this.art_models[artist_name] = md;
    }
    return this.art_models[artist_name];
  },
  checkLfmData: function(method, r, parsed) {
    if (this.resp_handlers[method]){
      this.resp_handlers[method].call(this, r, method, parsed);
    } else {
      this.unknown_methods[method] = true;
    }
  },
  resp_handlers: {
    'artist.getInfo': function(r, method) {
      var artist_name = spv.getTargetField(r, 'artist.name');
      if (artist_name){
        var images = spv.getTargetField(r, 'artist.image');
        this.setArtistImage(artist_name, images, method);
      }
      var artists = spv.toRealArray(spv.getTargetField(r, 'artist.similar.artist'));
      for (var i = 0; i < artists.length; i++) {
        var cur = artists[i];
        if (!cur.image) {continue;}
        this.setArtistImage(cur.name, cur.image, method + '.similar');
      }


    },
    'artist.getSimilar': function(r, method) {
      var artists = spv.toRealArray(spv.getTargetField(r, 'similarartists.artist'));
      for (var i = 0; i < artists.length; i++) {
        var cur = artists[i];
        if (!cur.image) {continue;}
        this.setArtistImage(cur.name, cur.image, method);
      }
    },
    'geo.getMetroUniqueTrackChart': function(r, method) {
      var tracks = spv.toRealArray(spv.getTargetField(r, 'toptracks.track'));
      for (var i = 0; i < tracks.length; i++) {
        var cur = tracks[i];
        this.setTrackImage({
          artist: cur.artist.name,
          track: cur.name
        }, cur.image, method);

      }
    },
    'album.getInfo': function(r, method) {
      var image = spv.getTargetField(r, 'album.image');
      var tracks = spv.toRealArray(spv.getTargetField(r, 'album.track'));
      for (var i = 0; i < tracks.length; i++) {
        var cur = tracks[i];
        this.setTrackImage({
          artist: cur.artist.name,
          track: cur.name
        }, image, method);

      }
    },
    'playlist.fetch': function(r, method) {
      var tracks = spv.toRealArray(spv.getTargetField(r, 'playlist.trackList.track'));
      for (var i = 0; i < tracks.length; i++) {
        var cur = tracks[i];
        this.setTrackImage({
          artist: cur.creator,
          track: cur.title
        }, cur.image, method);
      }

    },
    'user.getLovedTracks': function(r, method) {
      var tracks = spv.toRealArray(spv.getTargetField(r, 'lovedtracks.track'));

      for (var i = 0; i < tracks.length; i++) {
        var cur = tracks[i];
        this.setTrackImage({
          artist: cur.artist.name,
          track: cur.name
        }, cur.image, method);

      }

    },
    'user.getRecommendedArtists': function(r, method) {
      var artists = spv.toRealArray(spv.getTargetField(r, 'recommendations.artist'));

      for (var i = 0; i < artists.length; i++) {
        var cur = artists[i];
        if (!cur.image) {continue;}
        this.setArtistImage(cur.name, cur.image, method);
      }

    },
    'track.search': function(r, method) {
      var tracks = spv.toRealArray(spv.getTargetField(r, 'results.trackmatches.track'));

      for (var i = 0; i < tracks.length; i++) {
        var cur = tracks[i];
        this.setTrackImage({
          artist: cur.artist,
          track: cur.name
        }, cur.image, method);

      }

    },
    'artist.search': function(r, method) {
      var artists = spv.toRealArray(spv.getTargetField(r, 'results.artistmatches.artist'));
      for (var i = 0; i < artists.length; i++) {
        var cur = artists[i];
        if (!cur.image) {continue;}
        this.setArtistImage(cur.name, cur.image, method);
      }
    },
    'artist.getTopTracks': function(r, method, tracks) {
      tracks = tracks || spv.toRealArray(spv.getTargetField(r, 'toptracks.track'));
      for (var i = 0; i < tracks.length; i++) {
        var cur = tracks[i];
        this.setTrackImage({
          artist: cur.artist.name,
          track: cur.name
        }, cur.image, method);

      }
    },
    'tag.getTopArtists': function(r, method, artists) {
      artists = artists || spv.toRealArray(spv.getTargetField(r, 'topartists.artist'));
      for (var i = 0; i < artists.length; i++) {
        var cur = artists[i];
        if (!cur.image) {continue;}
        this.setArtistImage(cur.name, cur.image, method);
      }

    },
    'tag.getWeeklyArtistChart': function(r, method, artists) {
      artists = artists || spv.toRealArray(spv.getTargetField(r, 'weeklyartistchart.artist'));
      for (var i = 0; i < artists.length; i++) {
        var cur = artists[i];
        if (!cur.image) {continue;}
        this.setArtistImage(cur.name, cur.image, method);
      }
    }
  }
});

return LastFMArtistImagesSelector
})
