export default class UserdataHelper {

	constructor(node) {
		this.node = node;
		// 'type' => { data, node }
		this.userData = {
			physics: [],
			interaction: []
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

}
