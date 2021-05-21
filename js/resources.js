export default class ResourcesHelper {

	constructor(player) {
		this.userdata = player.userdata;
		this.cache = [];
		this.processUserData(player.userdata.userData.load);
	}

	processUserData(userdata) {
		const cache = this.cache;
		for (var i = 0; i < userdata.length; i++) {
			const node = userdata[i].node;
			const data = userdata[i].data;

			this.load(
				data.model,
				(obj) => this.addLoaded(node, data.model, obj)
			);

		}
	}

	addLoaded(node, res, obj) {
		this.cache[res] = obj;
		node.add(obj);
		this.userdata.extractUserData(obj);
	}

	isCached(res) {
		return (res in this.cache) && (this.cache[res] != null);
	}

	load(res, onLoaded) {
		if (this.isCached(res)) {
			onLoaded(this.cache[res]);
			return;
		}

		const cache = this.cache;
		const loader = new THREE.ObjectLoader();
		loader.load(
			'models/' + res + '.json?v=' + Math.random(),
			function ( obj ) {
				cache[res] = obj;
				onLoaded(obj);
			},
			// onProgress callback
			null,
			// onError callback
			function ( err ) {
				console.error( 'An error happened when loading item ', res);
			}
		);

	}




}
