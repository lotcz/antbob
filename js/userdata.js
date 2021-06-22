export default class UserdataHelper {

	constructor(node) {
		this.node = node;
		// 'type' => { data, node }
		this.userData = {
			load: [],
			stairs: [],
			roots: [],
			physics: [],
			story: [],
			interaction: [],
			pucella: []
		};
		this.extractUserData(node);
	}

	extractUserData(node) {
		if (node.children) {
			for (var i = 0; i < node.children.length; i++)
				this.extractUserData(node.children[i]);
		}

		if (!node.userData) return;

		for (var key in this.userData)
			if (node.userData.hasOwnProperty(key))
				this.userData[key].push({ data: node.userData[key], node: node});
	}

	removeUserData(key, data) {
		this.userData[key] = this.userData[key].filter((i) => i != data);
	}

}
