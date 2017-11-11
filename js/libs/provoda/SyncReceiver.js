define(function(require) {
'use strict';

var MDProxy = require('./MDProxy');

var slice = Array.prototype.slice;

var FakeModel = function(model_skeleton, stream) {
	this.stream = stream;
	this._provoda_id = model_skeleton._provoda_id;

	this.children_models = model_skeleton.children_models;
	this.map_level_num = model_skeleton.map_level_num;
	this.map_parent = model_skeleton.map_parent;
	this.model_name = model_skeleton.model_name;
	this.mpx = model_skeleton.mpx;
	this.states = model_skeleton.states;

};

FakeModel.prototype = {
	getParentMapModel: function() {
		return this.map_parent;
	},
	RealRemoteCall: function(arguments_obj) {
		this.stream.RPCLegacy(this._provoda_id, slice.call(arguments_obj));
	},
	RPCLegacy: function() {
		this.RealRemoteCall(arguments);
	}
};


var idToModel = function(index, ids) {
	if (typeof ids == 'number'){
		return index[ids];
	} else if (Array.isArray(ids)) {
		var result = new Array(ids.length);
		for (var i = 0; i < ids.length; i++) {
			result[i] = index[ids[i]];

		}
		return result;
	} else {
		/*if (ids){
			debugger;
		}*/

		return ids;
	}
};


var SyncReceiver = function(stream){
	this.stream = stream;
	this.md_proxs_index = {};
	this.models_index = {};

};

SyncReceiver.prototype = {

	buildTree: function(array) {
		var i, cur, cur_pvid;

		for (i = 0; i < array.length; i++) {
			cur = array[i];
			cur_pvid = cur._provoda_id;
			if (!this.models_index[cur_pvid]){
				this.models_index[cur_pvid] = new FakeModel(cur, this.stream);
			}
			//резервируем объекты для моделей
			//big_index[cur_pvid] = true;
			//^_highway.models[cur_pvid] = true;
		}

		for (i = 0; i < array.length; i++) {
			//восстанавливаем связи моделей
			cur_pvid = array[i]._provoda_id;
			cur = this.models_index[cur_pvid];
			cur.map_parent = idToModel(this.models_index, cur.map_parent);
			for (var nesting_name in cur.children_models) {
				cur.children_models[nesting_name] = idToModel(this.models_index, cur.children_models[nesting_name]);

			}

		}


		for (i = 0; i < array.length; i++) {
			//создаём передатчики обновлений во вьюхи
			cur = array[i];
			cur_pvid = cur._provoda_id;
			if (!this.md_proxs_index[cur_pvid]){
				this.md_proxs_index[cur_pvid] = new MDProxy(cur._provoda_id, cur.states, cur.children_models, this.models_index[cur_pvid]);
				this.models_index[cur_pvid].mpx = this.md_proxs_index[cur_pvid];
			}
		}
		return array.length && this.models_index[array[0]._provoda_id];
	},
	actions: {
		buildtree: function(message) {
			return this.buildTree(message.value);
		},
		update_states: function(message) {
			var target_model = this.models_index[message._provoda_id];
			var target_md_proxy = this.md_proxs_index[message._provoda_id];

			for (var i = 0; i < message.value.length; i+=3) {
				var state_name = message.value[ i +1 ];
				var state_value = message.value[ i +2 ];
				target_model.states[state_name] = target_md_proxy.states[state_name] = state_value;
			}


			this.md_proxs_index[message._provoda_id].stackReceivedStates(message.value);
		},
		update_nesting: function(message) {
			if (message.struc) {
				this.buildTree(message.struc);
			}

			var target_model = this.models_index[message._provoda_id];
			var target_md_proxy = this.md_proxs_index[message._provoda_id];

			var fakes_models = idToModel(this.models_index, message.value);


			target_model.children_models[message.name]= fakes_models;
			//target_md_proxy.children_models[message.name] = fakes_models;
			target_md_proxy.sendCollectionChange(message.name, fakes_models);
		}
	}
};
return SyncReceiver;
});
