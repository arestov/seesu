define(function(require) {
'use strict';
var spv = require('spv');
var $ = require('jquery');
var cache_ajax = require('cache_ajax');


var parseArtistsResults = function(r){
  var artists_results = [];

  var artists = r.results.artistmatches.artist || false;
  artists = artists && spv.toRealArray(artists, 'name');
  for (var i=0; i < artists.length; i++) {
    artists_results.push(
      {
        artist: artists[i].name,
        image:artists[i].image && artists[i].image[1]['#text'].replace('/serve/64/','/serve/64s/')
      }
    );
  }
  return artists_results;
};


var parseTracksResults = function(r){
  var tracks_results = [];
  var tracks = r.results.trackmatches.track || false;
  tracks = tracks && spv.toRealArray(tracks, 'name');
  for (var i=0; i < tracks.length; i++) {
    tracks_results.push(
      {
        artist: tracks[i].artist,
        track: tracks[i].name,
        image: tracks[i].image && tracks[i].image[1]['#text'].replace('/serve/64/','/serve/64s/')

      }
    );
  }
  return tracks_results;
};


var parseTagsResults = function(r){
  var tags_results = [];

  var tags = r.results.tagmatches.tag || false;
  tags = tags && spv.toRealArray(tags, 'name');
  for (var i=0; i < tags.length; i++) {
    tags_results.push({
      tag: tags[i].name
    });
  }
  return tags_results;
};
var parseAlbumsResults = function(r){
  var pdr= [];
  var albums =  r.results.albummatches.album || false;
  albums = albums && spv.toRealArray(albums, 'name');
  for (var i=0; i < albums.length; i++) {
    pdr.push({
      artist: albums[i].artist,
      image: albums[i].image && albums[i].image[1]['#text'].replace('/serve/64/','/serve/64s/'),
      album: albums[i].name
    });
  }
  return pdr;
};

var getLastfmSuggests = function(app, method, lfmquery, q, section, parser, no_preview){
  section.loading();
  var req = app.lfm.get(method, spv.cloneObj({limit: 15 }, lfmquery));
  section.addRequest(req);

  req.then(function(r){
    if (!section.doesNeed(q)){return;}
    section.loaded();
    r = r && parser(r, section.resItem, method);
    if (r.length){
      section.appendResults(r);
      section.renderSuggests(true, !no_preview);
    } else{
      section.renderSuggests(true, !no_preview);
    }

  }, function(){
    if (!section.doesNeed(q)){return;}
    section.loaded();
  });

  return req;
};

var parseFastSuggests = function(r){
  var sugg_arts = spv.filter(r.response.docs, 'restype', 6);
  $.each(sugg_arts, function(i, el){
    sugg_arts[i] = {
      artist: el.artist,
      image: el.image ? ('http://userserve-ak.last.fm/serve/34s/' + el.image) : false
    };
  });

  var sugg_tracks = spv.filter(r.response.docs, 'restype', 9);
  $.each(sugg_tracks, function(i, el){
    sugg_tracks[i] ={
      artist: el.artist,
      track: el.track,
      image: el.image ? ('http://userserve-ak.last.fm/serve/34s/' + el.image) : false,
      duration: el.duration
    };
  });

  var sugg_tags = spv.filter(r.response.docs, 'restype', 32);
  $.each(sugg_tags, function(i, el){
    sugg_tags[i] = {
      tag: el.tag
    };
  });


  var sugg_albums = spv.filter(r.response.docs, 'restype', 8);
  $.each(sugg_albums, function(i, el){
    sugg_albums[i] = {
      artist: el.artist,
      album: el.album,
      image: el.image ? ('http://userserve-ak.last.fm/serve/34s/' + el.image) : false,
      resid: el.resid
    };
  });


  return {
    artists: sugg_arts,
    tracks: sugg_tracks,
    tags: sugg_tags,
    albums: sugg_albums
  };
};

var fast_suggestion = function(r, q, invstg){
  if (invstg.doesNeed(q)){
    var artists = invstg.g('section-artist'),
      tracks = invstg.g('section-track'),
      tags = invstg.g('section-tag'),
      albums = invstg.g('section-album');

    r = parseFastSuggests(r);

      artists.appendResults(r.artists);
      artists.renderSuggests();

      tracks.appendResults(r.tracks);
      tracks.renderSuggests();

      tags.appendResults(r.tags);
      tags.renderSuggests();

      albums.appendResults(r.albums);
      albums.renderSuggests();
  }
};

var get_fast_suggests = spv.debounce(function(q, callback, hash, invstg){
  return $.ajax({
    url: 'http://www.last.fm/search/autocomplete',
    global: false,
    type: "GET",
    timeout: 15000,
    headers:{
      'X-Requested-With': 'XMLHttpRequest'
    },
    dataType: "json",
    data: {
      "q": q,
      "force" : 1
    },
    error: function(){

    },
    success: function(r){
      cache_ajax.set('lfm_fs', hash, r);
      if (callback){callback(r);}
    }	,
    complete: function(){
      invstg.loaded(q);
    }
  });
},400);

return {
  parseArtistsResults:parseArtistsResults,
  parseTracksResults:parseTracksResults,
  parseTagsResults:parseTagsResults,
  parseAlbumsResults:parseAlbumsResults,
  getLastfmSuggests:getLastfmSuggests,
  parseFastSuggests:parseFastSuggests,
  fast_suggestion:fast_suggestion,
  get_fast_suggests:get_fast_suggests
};
});
