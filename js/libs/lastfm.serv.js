var parseArtistInfo = function(r){
	var ai = {};
	if (r && r.artist){
		var info = r.artist;

		
		ai.artist = getTargetField(info, 'name');
		ai.bio = (ai.bio = getTargetField(info, 'bio.summary')) && ai.bio.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
		ai.similars = (ai.similars = getTargetField(info, 'similar.artist')) && toRealArray(ai.similars);
		ai.tags = (ai.tags = getTargetField(info, 'tags.tag')) && toRealArray(ai.tags);
		ai.images = (ai.images = getTargetField(info, 'image')) && (ai.images = toRealArray(ai.images)) && $filter(ai.images, '#text');

	}
	return ai;
}

var makeArrayDeeper = function(array){
	var r = [];
	for (var i=0; i < array.length; i++) {
		r.push({
			d: array[i]
		});
		
	};
	return r
};
var simplifyName= function(v){
	return v && v.toLowerCase().replace(/\s/gi, '');
};
var markOriginalAlbum = function(target, albums, field){
	var cached_value = simplifyName(getTargetField(target, field));
	
	
	for (var i=0; i < albums.length; i++) {
		var cur = albums[i];
		if (cur != target){
			var cur_value = simplifyName(getTargetField(cur, field));
			if (cur_value.indexOf(cached_value) == 0){
				if (!(target.acceptor && cached_value == cur_value)){
					cur.acceptor = true;
					delete cur.original;
					if (!target.acceptor){
						target.original = true;
					}
					
				}
			}
		}
	}
};

var checkOriginalAlbums = function(albums){
	for (var i=0; i < albums.length; i++) {
		markOriginalAlbum(albums[i], albums, 'd.name')
		
	};
	return albums;
};
var sortAlbs = function(a, b){
	return sortByRules(a, b, [
		'acceptor',
		{
			field: 'original',
			reverse: true
		},
		function(el){
			return parseFloat(getTargetField(el, 'd.@attr.rank'));
		},
		{
			field: 'year.text',
			reverse: true
		}
	]);
};

var sortLfmAlbums = function(albums, artist){
	var ob = {
		own: $filter(makeArrayDeeper(toRealArray(albums)), 'd.artist.name', artist),
		ordered: []
	};
	ob.foreign = ob.own.not;
	checkOriginalAlbums(ob.own);
	checkOriginalAlbums(ob.foreign);
	
	
	if (ob.own.length){
		ob.own.sort(sortAlbs);
		var oae = $filter(ob.own, 'acceptor', true);
		if (oae.not && oae.not.length){
			ob.ordered.push($filter(oae.not, 'd'));
		}
		if (oae.length){
			ob.ordered.push($filter(oae, 'd'));
		}
	}
	if (ob.foreign.length){
		ob.foreign.sort(sortAlbs);
		ob.ordered.push($filter(ob.foreign, 'd'));
		
	}
	
	return ob;
};