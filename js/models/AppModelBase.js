define(['provoda', 'spv', '../libs/BrowseMap'], function(provoda, spv, BrowseMap) {
"use strict";
var AppModelBase = function() {};
provoda.Model.extendTo(AppModelBase, {
	init: function() {
		this._super();
		this.navigation = [];
		this.map = new BrowseMap();
		this.on('state-change.current_mp_md', function(e) {
			if (e.value){
				this.resortQueue();
			}

		});
	},
	setDocTitle: function(title) {
		this.updateState('doc_title', title);
	},
	getBMapTravelFunc: function(func, context) {
		return function() {
			return context.collectChanges(func, arguments);
		};
	},
	changeNavTree: function(nav_tree) {
		this.nav_tree = spv.filter(nav_tree, 'resident');
		this.checkNowPlayNav();
	},
	restoreFreezed: function(transit){
		this.map.restoreFreezed(transit);
	},
	showStartPage: function(){
		//mainaly for hash url games
		this.map.startNewBrowse();
	},
	'mapch-handlers': {
		"zoom-in": function(array) {
			var target;
			for (var i = array.length - 1; i >= 0; i--) {
				var cur = array[i];
				if (cur.type == 'move-view' && cur.value){
					target = cur.target.getMD();
					break;
				}

			}
			return target;
		},
		"zoom-out": function(array) {
			var target;
			for (var i = array.length - 1; i >= 0; i--) {
				var cur = array[i];
				if (cur.type == 'zoom-out' || cur.type == 'move-view'){//&& cur.value
					target = cur.target.getMD();
					break;
				}

			}
			return target;
		}
	},
	'model-mapch': {
		'move-view': function(change) {
			var parent = change.target.getMD().getParentMapModel();
			if (parent){
				//mp-source
				/*
				var mp_source = change.target.state('mp-source');
				if (mp_source){
					parent.updateState('mp-highlight', mp_source);
				}*/
				parent.updateState('mp_has_focus', false);
			}
			change.target.getMD().updateState('mp_show', change.value);
		},
		'zoom-out': function(change) {
			change.target.getMD().updateState('mp_show', false);
		},
		'destroy': function(change) {
			var md = change.target.getMD();
			md.mlmDie();
			md.updateState('mp_show', false);
		}
	},
	animationMark: function(models, mark) {
		for (var i = 0; i < models.length; i++) {
			models[i].getMD().updateState('map_animating', mark);
		}
	},
	animateMapChanges: function(changes) {
		var
			i,
			target_md,
			all_changhes = spv.filter(changes.array, 'changes');

		all_changhes = [].concat.apply([], all_changhes);
		var models = spv.filter(all_changhes, 'target');
		this.animationMark(models, changes.anid);

		for (i = 0; i < all_changhes.length; i++) {
			var change = all_changhes[i];
		//	change.anid = changes.anid;
			var handler = this['model-mapch'][change.type];
			if (handler){
				handler.call(this, change);
			}
		}

		for (i = changes.array.length - 1; i >= 0; i--) {
			var cur = changes.array[i];
			if (this['mapch-handlers'][cur.name]){
				target_md = this['mapch-handlers'][cur.name].call(this, cur.changes);
				break;
			}
		}
		/*
			подсветить/заменить текущий источник
			проскроллить к источнику при отдалении
			просроллить к источнику при приближении
		*/
		if (target_md){
			target_md.updateState('mp_has_focus', true);

			this.updateState('show_search_form', !!target_md.state('needs_search_from'));
			this.updateState('full_page_need', !!target_md.full_page_need);
			this.updateState('current_mp_md', target_md);
			//target_md.updateState('mp-highlight', false);


		}
		this.updateState('map_animation', changes);
		this.updateState('map_animation', false);
		this.animationMark(models, false);
	},
	bindMMapStateChanges: function(md) {
		var _this = this;

		md.on('mpl-attach', function() {
			md.updateState('mpl_attached', true);
			var navigation = _this.getNesting('navigation');
			var target_array = _this.getNesting('map_slice') || [];


			if (navigation.indexOf(md) == -1) {
				navigation.push(md);
				_this.updateNesting('navigation', navigation);
			}
			if (target_array.indexOf(md) == -1){
				target_array.push(md);
				_this.updateNesting('map_slice', target_array);
			}

		}, {immediately: true});
		md.on('mpl-detach', function(){
			md.updateState('mpl_attached', false);
			var navigation = _this.getNesting('navigation');
			var target_array = _this.getNesting('map_slice') || [];

			var new_nav = spv.arrayExclude(navigation, md);
			if (new_nav.length != navigation.length){
				_this.updateNesting('navigation', new_nav);
			}
			var new_tarr = spv.arrayExclude(target_array, md);

			if (new_tarr.length != target_array.length){
				_this.updateNesting('map_slice', new_tarr);
			}
		}, {immediately: true});
	},
	showMOnMap: function(model) {

		var aycocha = this.map.isCollectingChanges();
		if (!aycocha){
			this.map.startChangesCollecting();
		}

		if (!model.lev || !model.lev.canUse()){
			//если модель не прикреплена к карте прежде чем что-то делать - отображаем "родительску" модель
			this.showMOnMap(model.map_parent);
		}
		if (model.lev && model.lev.canUse()){//если модель прикреплена к карте

			if (model.lev.closed){
				//если замарожены - удаляем "незамороженное" и углубляемся до нужного уровня
				this.map.restoreFreezedLev(model.lev);
			}
			//отсекаем всё более глубокое
			model.lev.sliceTillMe();
		} else {
			if (!model.model_name){
				throw new Error('model must have model_name prop');
			}
			this.bindMMapStateChanges(model, model.model_name);
			this.map.goDeeper(model);

		}

		if (!aycocha){
			this.map.finishChangesCollecting();
		}

		return model;
		//
	},
	collectChanges: function(fn, args, opts) {
		var aycocha = this.map.isCollectingChanges();
		if (!aycocha){
			this.map.startChangesCollecting(opts);
		}

		var result = fn.apply(this, args);

		if (!aycocha){
			this.map.finishChangesCollecting();
		}
		return result;
	},
	resortQueue: function(queue) {
		if (queue){
			queue.removePrioMarks();
		} else {
			for (var i = 0; i < this.all_queues.length; i++) {
				this.all_queues[i].removePrioMarks();
			}
		}
		var md = this.state('current_mp_md');
		if (md){
			if (md.checkRequestsPriority){
				md.checkRequestsPriority();
			} else if (md.setPrio){
				md.setPrio();
			}
		}
		
		this.checkActingRequestsPriority();
	}
});


return AppModelBase;
});
