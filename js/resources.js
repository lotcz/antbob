export default class ResourcesHelper {

	constructor(player) {
		this.userdata = player.userdata;
		this.cache = [];
	}

	async processUserData(userdata) {
		const tasks = [];
		for (let i = 0; i < userdata.length; i++) {
			tasks.push(this.loadAndAdd(userdata[i].node, userdata[i].data.model));
		}
		await Promise.all(tasks);
	}

	async loadAndAdd(node, res) {
		const resource = await this.load(res);
		const obj = resource.clone();
		node.add(obj);
		this.userdata.extractUserData(obj);
	}

	isCached(res) {
		return (res in this.cache) && (this.cache[res] != null);
	}

	async load(res) {
		if (this.isCached(res)) {
			return this.cache[res];
		}

		const promise = new Promise(function(resolve, reject) {
			const loader = new THREE.ObjectLoader();
			loader.load(
				'models/' + res + '.json?v=' + Math.random(),
				(obj) => resolve(obj),
				null,
				(err) => reject(err)
			);
		});
		const obj = await promise;
		this.cache[res] = obj;
		return obj;
	}

}
