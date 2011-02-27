sviga = {};
var localize= (function(){
	var lang = navigator.language;
	return function(string, j){
		if (localizer[string]){
			return localizer[string][lang] || localizer[string].original;
		} else{
			if (j){
				sviga[string] ={
					original:j
				};
				return j;
			}
			
			return 'no this localization';
		}
		
	}
})()

localizer = {
    "search": {
        "original": "Search",
        ru: "Поиск"
    },
    "trysearches": {
        "original": "try to search",
        ru: "Попробуйте найти"
    },
    "search-control-hint": {
        "original": "Use keyboard: up and down arrows, enter",
        ru: "Используйте клавиатуру: стрелки вверх, вниз и клавишу ввод"
        
    },
    "reccoms": {
        "original": "Recommendations",
        ru: "Рекомендации"
    },
    "lastfm-reccoms-access": {
        "original": "To get your music recommendations you need to grant Seesu your last.fm account access",
        ru: "Что бы получить рекомендации вам нужно дать Сису доступ к вашему эккаунту на last.fm"
    },
    "grant": {
        "original": "grant",
        ru: "дать доступ"
    },
    "user-granted-lfm": {
        "original": "I've granted my account access to Seesu",
        ru: "Я дал Сису доступ к своему эккаунту"
    },
    "give-reccoms": {
        "original": "give me recommendations",
        ru: "получить рекомендации"
    },
    "grant-lfm-desc": {
        "original": "It's simple and safe. It does not require your last.fm password.",
        ru: "Это просто и безопасно, не требует ваш пароль от last.fm"
    },
    "or-type-username": {
        "original": "or type username",
        ru: "или введите имя пользователя"
    },
    "type-friend-desc": {
        "original": " (you can type your friend)",
        ru: "(вы можете ввести вашего друга)"
    },
    "grant-love-lfm-access": {
        "original": "To get your favorite tracks you need to grant Seesu your last.fm account access ",
        ru: "Что бы получить ваши любимые треки вам нужно дать Сису доступ к вашему эккаунту на last.fm"
    },
    "give-love": {
        "original": "give me loved tracks",
        ru: "получить любимые композиции"
    },
    "loved-tracks": {
    	"original": "Loved Tracks",
    	ru: "Любимые композиции"
    },
    "playlists": {
    	"original": "Playlists",
    	ru: "Плейлисты"
    },
    "profile":{
    	"original": "profile",
    	ru: 'страница'
    },
    "Tags": {
    	"original": "Tags",
    	ru: "Теги"	
    },
    "get-albums":{
    	"original": "get albums",
    	ru: "получить альбомы"	
    },
    "similar-arts": {
    	"original":	"Similar artists",
    	ru: "Похожие артисты"
    },
    "albums": {
    	"original": "Albums",
    	ru: "Альбомы"	
    },
    "top-tracks":{
    	"original": "top tracks",
    	ru: 'лучшие треки'	
    },
    "stop-flash": {
        "original": "To stop annoing «Adobe Flash Player Security» window copy this address:",
        ru: "Что бы убрать сообщение об  «Adobe Flash Player Security» скопируйте следующий адрес"
    },
    "add-to-wl": {
        "original": "add it to white list on",
        ru: "добавьте его в белый список на"
    },
    "flashpage": {
    	"original": "flash internet security page",
    	ru: "странице безопасности флеша"
    },
    "and-restart": {
    	"original": "and then restart Seesu",
    	ru: "и перезапустите Сису"
    },
    
    "bad-flash-desc": {
        "original": "About flash security: usualy flash player works in widget sandbox on your computer. As deafult it has not access to internet. To give it access to mp3 which stores on vk.com you may need change settings on flash security page. On the same page you can deny access.",
        ru: "О безопасности флеша: по умолчанию флеш плеер работает среди ограничений накладывающееся на виджеты, при этом не имеет доступа в интернет. Чтобы дать доступ к mp3 файлам располагающихся на сайта вам нужно изменить настройки на соответствующей странице. Там же вы можете и ограничить доступ."
    },
    "lastfm-scrobble-access": {
        "original": "To scrobble to last.fm you must grant access to Seesu",
        ru: "Для скроблинга вам нужно дать Сису доступ к своему last.fm эккаунту"
    },
    "to-get-mp3-sign-to-vk": {
        "original": "To get mp3 files you need to sign in to vk.com (vkontakte.ru)",
        ru: "Что бы получить доступ к mp3 файлам вы должны войти во vkontakte.ru (vk.com)"
    },
    "sign": {
        "original": "sign in",
        ru: "войти"
    },
    "you-may": {
        "original": "You may",
        ru: "Вы можете"
    },
    "create-acc": {
        "original": "create new account",
        ru: "создать эккаунт"
    },
    "its-free": {
        "original": "(it's free)",
        ru: "(это бесплатно)"
    },
    "to-get-mp3-login-to-vk": {
        "original": "To get mp3 files you need to login to vk.com or to vkontakte.ru",
        ru: "Что бы получить доступ к mp3 файлам вы должны дать доступ к вашему эккаунту vkontakte.ru или vk.com"
    },
    "open-api-secure": {
        "original": "Try both if you get «Open API security breach».",
        ru: "Попробуйте и то и другое, если у вас появляется сообщение «Open API security breach»."
    },
    "email": {
        "original": "E-mail",
        ru: "Почта"
    },
    "password": {
        "original": "Password",
        ru: 'Пароль'
    },
    "savepass": {
        "original": "Save password in Seesu",
        ru: "Сохранить пароль в Сису"
    },
    "playlist-getmp3": {
        "original": "Make playable all tracks in playlist",
        ru: 'Сделать все песни доступными'
    },
    "playlist-export": {
        "original": "Export m3u playlist",
        ru: "Сохранить плейлист в m3u файл"
    },
    "addsong": {
        "original": "add song to",
        "ru": "добавить композицию в"
    },
     "to-search": {
        "original": "Search ",
        ru: "Искать "
    },
    "in-artists": {
        "original": "in artists",
        ru: "в артистах"
    },
    "in-tracks": {
        "original": "in tracks",
        ru: "в треках"
    },
    "in-tags": {
        "original": "in tags",
        ru: "в тэгах"
    },
    "video": {
        "original": "Video",
        ru: "Видео"
    },
    "hide-them": {
        "original": "hide them",
        ru: "скрыть их"
    },
    "show-them": {
        "original": "show them",
        ru: "показать их"
    },
    "direct-vk-search": {
        "original": "Search mp3  directly in vkontakte",
        ru: 'Искать mp3 прямо во вконтакте'
    },
    "Artists": {
        "original": "Artists",
        ru: 'Артисты'
    },
    "Tracks": {
        "original": "Tracks",
        ru: 'Треки'
    },
    "artists": {
        "original": "artists",
        ru: 'артистов'
    },
    "tracks": {
        "original": "tracks",
        ru: 'треков'
    },
    "tags": {
    	'original': 'tags',
    	ru: 'тегов'	
    },
    "fine-more": {
        "original": "find more",
        ru: 'Найти больше'
    },
    "now-playing": {
        "original": "Now Playing",
        ru: 'Сейчас играет'
    },
    "nothing-found": {
        "original": "Nothing found",
        ru: 'Не найдено'
    }
}