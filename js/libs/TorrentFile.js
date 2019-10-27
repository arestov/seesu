var FileInTorque = function() {};

songFileModel.extendTo(FileInTorque, {
  init: function(opts) {
    this.file_in_torrent = opts.file_in_torrent;
    this.file_name = opts.name;
    this.torrent = opts.torrent;
    this.link = opts.link;
    this.getFileInTorrent = opts.getFileInTorrent;
    //this.file_in_torrent.get('properties').get('streaming_url');
    return this._super.apply(this, arguments);
  },
  getTitle: function() {
    return this.file_name;
  },
  unloadOutBox: function() {

  },
  load: function(){
    var _this = this;
    if (this.player){
      if (this.loadOutBox){
        this.loadOutBox();
      }
      this._createSound();
      this.player.load(this);
    }
  },
  play: function(){
    if (this.player){
      this.load();

      this.player.play(this);
    }
  },
  loadOutBox: function() {
    var _this = this;

    var complect = this.getFileInTorrent(this.file_in_torrent);

    var file_in_torrent = complect && complect.file;
    if (!file_in_torrent){
      console.log('torrents api dishronization');
      return;
    }
    var download_started = file_in_torrent.get('properties').get('downloaded');

    if (!download_started){
      complect.torrent.get('file').each(function(file) {
        if (file != file_in_torrent){
          //file.get('properties').save({priority: 0});
        }

      });
      file_in_torrent.get('properties').save({priority: 15});
      if (!download_started){
        file_in_torrent.stream();
      }

      complect.torrent.set_priority(Btapp.TORRENT.PRIORITY.MEDIUM);
      complect.torrent.start();
    } else {
      file_in_torrent.get('properties').save({priority: 15});
    }






  //	this.forceStream();

    //this.forceStream();
  },
  forceStream: function() {
    this.file_in_torrent.stream();
  //	this.file_in_torrent.force_stream();
    //this.torrent.stream();
  //	this.torrent.force_stream();
  }
});
