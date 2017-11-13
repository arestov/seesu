var muansPack = function(){
  this.store = {}
};
createPrototype(muansPack, new pv.Eventor(), {
  addMuans: function(mu_ans, name){
    this.store[name] = mu_ans;
  },
  isAvailable: function() {
    for (var a in this.store){
      if (!this.store[a].isAvailable()){
        return false;
      }
    }
    return true;
  },
  canSearchBy: function(msearch) {
    var can;
    if (this.isAvailable()){
      for (var a in this.store){
        if (this.store[a].canSearchBy(msearch)){
          return true;
        }
      }
    }
  }
});


var muAns = function(msearch) {
  this.callParentMethod('init');
  this.msearch = msearch;
};
createPrototype(muAns, new pv.Eventor(), {
  setSearch: function() {
    this.msearch = msearch;
  },
  busy: function(state) {
    this.progress = !!state;
  },
  isBusy: function() {
    return this.progress
  },
  reject: function(non_fixable, only_others) {
    this.error = true;
    if (non_fixable){
      this.non_fixable = true
    } else {
      if (only_others){
        this.only_others = true;
      }
    }
    this.fin = true;
    this.busy(false);
    this.trigger('fail', non_fixable, only_others);
  },
  resolve: function(files) {
    delete this.error;
    files = spv.toRealArray(files);
    if (files.length){
      this.t = files;
    }
    this.fin = true;
    this.busy(false);
    this.trigger('done', this.t);
  },
  done: function(cb){
    this.on('done', cb);
  },
  fail: function() {
    this.on('fail', cb);
  },
  isComplete: function() {
    return this.fin;
  },
  isAvailable: function() {
    return 	!this.error || !this.non_fixable
  },
  canSearchBy: function(msearch) {
    if (!this.isBusy()){
      if (this.isComplete()) {
        if (this.error){
          if (this.non_fixable){
            return false;
          } else {
            if (this.only_others){
              if (this.msearch == msearch){
                return false
              } else {
                return true
              }
            } else {
              return true;
            }
          }
        } else {
          return false;
        }
      } else {
        return true;
      }
    }
  }
});

var FileInTorrent = function(query, torrent_link){

}
/*
<div id="cse" style="width: 100%;">Loading</div>
<script src="http://www.google.com/jsapi" type="text/javascript"></script>
<script type="text/javascript">
  google.load('search', '1', {language : 'en', style : google.loader.themes.V2_DEFAULT});
  google.setOnLoadCallback(function() {
    var customSearchOptions = {};  var customSearchControl = new google.search.CustomSearchControl(
      '001069742470440223270:3zaccy_n32i', customSearchOptions);
    customSearchControl.setResultSetSize(google.search.Search.FILTERED_CSE_RESULTSET);
    customSearchControl.draw('cse');
  }, true);
</script>

001069742470440223270:3zaccy_n32i

*/
//Star Slinger  Elizabeth Fraser ".mp3" -inurl:(htm|html|php) intitle:("index of")
//"Hudson Mohawke" "All Your Love" -inurl:(htm|html|php) intitle:"index of" "last modified" "parent directory" description size mp3

var findTorrentMP3Song = function(data) {
  $.ajax({
    global: false,
    type: "GET",
    dataType: "jsonp",
    url: "http://ajax.googleapis.com/ajax/services/search/web?v=1.0&cx=001069742470440223270:3zaccy_n32i",
    data: data,
    error:function(){
      console.log('google search requset error')
    },
    success: function(r){
      console.log(r);

    }
  });
};
