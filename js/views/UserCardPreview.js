define(['provoda', 'jquery', 'app_serv', './uacq'], function(provoda, $, app_serv, uacq) {
"use strict";
var localize = app_serv.localize;
var UserCardPreview = function() {};
provoda.View.extendTo(UserCardPreview, {
	dom_rp: true,
	createBase: function() {
		this.c = this.root_view.els.pestf_preview;
		this.aqc_preview_c = this.c.find('.aqc_preview');

		//this.c.text('Персональная музыка');
		var _this = this;

		var button = this.c.find('.to-open-block').click(function() {
			_this.RPCLegacy('requestPage');
			//_this.RPCLegacy('requestPage');
		});
		this.addWayPoint(button);
		this.button = button;
		this.dom_related_props.push('button');

	},
	'stch-vmp_show': function(state) {
		this.button.toggleClass('button_selected', !!state);
	},
	'stch-can_expand': function(state){
		if (state){
			this.requirePart('start-page-blocks');
		}
	},
	children_views: {
		users_acqutes : {
			main: uacq.UserAcquaintancesListPreview
		}
	},
	'collch-users_acqutes': 'aqc_preview_c',
	parts_builder: {
		'start-page-blocks': function() {
			var _this = this;
			var createPeopleListEl = function(img_src, opts){
				opts = opts || {};

				var ui = {
					c: false,
					bp: false,
					imgc: false,
					lp: false
				};
				var li = ui.c = $('<li class="people-list-item"></li>');
				var img_c = ui.imgc = $('<div class="people-image"></div>').appendTo(li);

				$('<img/>').attr('src', img_src || 'https://vk.com/images/camera_b.gif').appendTo(img_c);

				ui.bp = $('<div class="button-place-people-el"></div>').appendTo(li);
				ui.lp = $('<div class="p-link-place"></div>').appendTo(li);
				return ui;
			};




			var buildPeopleLE = function(man, opts){
				opts = opts || {};

				var pui = createPeopleListEl(man.info.photo);


				if (opts.links){
					pui.lp.append(_this.root_view.getAcceptedDesc(man));

				} else if (opts.accept_button){
					var nb = _this.root_view.createNiceButton();
						nb.b.text( localize('accept-inv', 'Accept invite'));
						nb.enable();

						var pliking;

						nb.b.click(function(){
							if (!pliking){
								//var p =
								su.s.api('relations.acceptInvite', {from: man.user}, function(r){

									if (r.done){
										su.trackEvent('people likes', 'accepted', false, 5);
										$('<span class="desc"></span>').text(su.getRemainTimeText(r.done.est, true)).appendTo(pui.lp);
										if (new Date(r.done.est) < new Date()){
											//checkRelationsInvites();
										}
										nb.c.remove();
									}
									pliking = false;
								});
								pliking = true;
							}
						});
					nb.c.appendTo(pui.bp);
				}

				return pui.c;
			};
			var createPeopleList = function(people, opts){
				opts = opts || {};

				var ul = $("<ul class='people-list'></ul>");
				if (opts.wide){
					ul.addClass('people-l-wide');
				}

				for (var i=0; i < people.length; i++) {
					if (people[i].info){
						ul.append(buildPeopleLE(people[i], opts));
					}
				}
				return ul;
			};
			return true;
		}
	}
});
return UserCardPreview;
});