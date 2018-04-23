define(function (require) {
'use strict';

var uacq = require('../../uacq');
var StartPageView = require('../../StartPageView');
var SearchPageView = require('../../SearchPageView');
var ArtcardUI = require('../../ArtcardUI');
var ArtistListView = require('../../ArtistListView');
var SongsListView = require('../../SongsListView');
var UserCardPage = require('../../UserCardPage');
var MusicConductorPage = require('../../MusicConductorPage');
var TagPageView = require('../../TagPageView');
var YoutubeVideoView = require('../../YoutubeVideoView');
var lul = require('../../lul');
var SongcardPage = require('../../SongcardPage');
var coct = require('../../coct');

return {
  $default: coct.ListOfListsView,
  start_page : StartPageView,
  invstg: SearchPageView,
  artcard: ArtcardUI,
  artslist: ArtistListView,
  playlist: {
    'main': SongsListView,
    'all-sufficient-details': SongsListView.SongsListDetailedView,
  },
  song: {
    'main': SongsListView.SongsListDetailedView
  },
  vk_usercard: UserCardPage.VkUsercardPageView,
  lfm_usercard: UserCardPage.LfmUsercardPageView,
  usercard: UserCardPage,
  allplaces: coct.SimpleListOfListsView,
  mconductor: MusicConductorPage,
  tag_page: TagPageView,
  tagslist: TagPageView.TagsListPage,
  user_playlists: coct.ListOfListsView,
  songs_lists: coct.ListOfListsView,
  artists_lists: coct.ListOfListsView,
  countries_list: coct.SimpleListOfListsView,
  city_place: coct.SimpleListOfListsView,
  cities_list: coct.SimpleListOfListsView,
  country_place: coct.ListOfListsView,
  tag_artists: coct.ListOfListsView,
  tag_songs: coct.ListOfListsView,
  youtube_video: YoutubeVideoView,
  vk_users: UserCardPage.VkUsersPageView,
  lfm_users: lul.LfmUsersPageView,
  lfm_listened_artists: coct.ListOfListsView,
  lfm_listened_tracks: coct.ListOfListsView,
  lfm_listened_albums: coct.ListOfListsView,
  lfm_listened_tags: lul.UserTagsPageView,
  vk_users_tracks: coct.ListOfListsView,
  lfm_user_tag: coct.ListOfListsView,
  user_acqs_list: uacq.UserAcquaintancesListView,
  albslist: coct.AlbumsListView,
  lula: lul.LULAPageVIew,
  lulas: lul.LULAsPageVIew,
  songcard: SongcardPage,
  justlists: coct.ListOfListsView,
  vk_posts: coct.VKPostsView,
  blogs_conductor: coct.ListOfListsView,
  blogs_list: coct.ListOfListsView,
  music_blog: coct.ListOfListsView,
  app_news: coct.AppNewsView
};
});
