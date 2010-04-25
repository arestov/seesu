try_mp3_providers = function(){
	var have_mp3_provider;
	var prov_count_down = 2;
	var mp3_prov_selected = widget.preferenceForKey('mp3-search-way');
	var provider_selected;
	var swith_to_provider = function(try_selected){
		if (provider_selected) {return false}
		if (mp3_prov_selected && seesu.delayed_search.available && seesu.delayed_search.available.length){
		
			
			for (var i=0; i < seesu.delayed_search.available.length; i++) {
				var current_prov = seesu.delayed_search.available[i];
				if (current_prov == mp3_prov_selected){
					seesu.delayed_search['switch_to_' + current_prov]();
					provider_selected = true;
					log('selected prov ' + current_prov);
				}
			};
			if (!provider_selected && !try_selected){
				var current_prov = seesu.delayed_search.available[0];
				if (current_prov){
					seesu.delayed_search['switch_to_' + current_prov]();
					provider_selected = true;
					log('not selected prov ' + current_prov);
				} else{
					log('must use vkontakte');
				}
			}
			
		} else if (!try_selected){
			var someone_available = seesu.delayed_search.available[0];
			if (someone_available){
				seesu.delayed_search['switch_to_' + someone_available]();
				log('some avai prov ' + someone_available)
			} else{
				log('must use vkontakte');
			}
		}
	}
	
	$.ajax({
	  url: "http://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20html%20WHERE%20url%3D'http%3A%2F%2Faudme.ru'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
	  success: function(r){

	  	if (!r.query.results){
	  		log(r.query.results)
			seesu.delayed_search.available.push('audme');
			$('#mp3way-audme').removeClass('cant-be-used');
			log('audme nice')
			swith_to_provider(true)	
		} else{
			log('audme error')
		}
		
		
		
	  },
	  timeout: 7000,
	  error: function(){
		log('audme error')
	  },
	  complete: function(){
		prov_count_down--;
		if (prov_count_down == 0){
			swith_to_provider();
		}
	  }
	})
  	if (seesu.vk.id && seesu.vk.big_vk_cookie) {
		$.ajax({
		  url: "http://vkontakte.ru/feed2.php",
		  global: false,
		  type: "GET",
		  dataType: "text",
		  timeout: 7000,
		  beforeSend: seesu.vk.set_xhr_headers,
		  success: function(text){
			if (text.match(/^\{/) && text.match(/\}$/)){
				try {
					var r = $.parseJSON(text);
					if (r.user && r.user.id) {
						if (seesu.vk_api){
							seesu.vk_api.viewer_id = r.user.id;
						}
				  		
						seesu.delayed_search.available.push('vk');
						seesu.vk_logged_in = true;
						log('vk mp3 prov ok')
						swith_to_provider(true)
					} else{
						vk_logged_out();
						log('vk mp3 prov faild')
					}
				} catch(e) {
					log(e)
				}
			} else{
				vk_logged_out();
				log('vk mp3 prov faild (can not parse)')
			}



		  },
		  error: function(xhr){
			log('vk mp3 prov faild with jq error')
			vk_logged_out();
		  },
		  complete: function(xhr){
			prov_count_down--;
			if (prov_count_down == 0){
				swith_to_provider();
			}
		  }

		});
	} else{
		log('vk mp3 prov faild cos not auth')
		vk_logged_out();
		prov_count_down--;
		if (prov_count_down == 0){
			swith_to_provider();
		}
	}
	
}	
