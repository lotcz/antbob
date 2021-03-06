export default class RootsHelper {

	constructor(player) {
		this.player = player;
		this.processUserData(player.userdata);
	}

	processUserData(userdata) {
		for (var i = 0; i < userdata.userData.roots.length; i++) {
			let udata = userdata.userData.roots[i];
			this.addRoots(udata.node, udata.data.levels);
		}
	}

	addRoots(threeObject, levels) {
		if (levels <= 0) return;

		var sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(threeObject.scale.x * threeObject.geometry.parameters.radiusBottom * 1.2, 3), threeObject.material);
		sphere.position.copy(threeObject.position);
		sphere.position.y -= threeObject.scale.y * threeObject.geometry.parameters.height * 0.5;
		sphere.castShadow = threeObject.castShadow;
		sphere.receiveShadow = threeObject.receiveShadow;
		threeObject.parent.add(sphere);

		var span = 0.05 * levels;
		var arms = 2;
		for (var i = 0; i < arms; i++) {
			let root = this.addRoot(threeObject, levels);
			let v = - (span / 2) + (i * span);
			root.quaternion.x = v + (0.5 / levels);
			//root.quaternion.y = v;
			root.quaternion.z = v - (0.1 / levels);
			//root.quaternion.y = (i * span);
		}
	}

	addRoot(threeObject, levels) {
		var scale = 0.5;
		var group = new THREE.Group();
		group.position.copy(threeObject.position);
		group.position.y -= threeObject.scale.y * threeObject.geometry.parameters.height * 0.5;

		var root = threeObject.clone();
		root.scale.x = threeObject.scale.x * scale;
		root.scale.y = threeObject.scale.y * (scale + 0.25);
		root.scale.z = threeObject.scale.z * scale;
		root.position.set(0, - root.scale.y * threeObject.geometry.parameters.height * 0.5, 0);

		group.add(root);
		this.addRoots(root, levels - 1);

		//group.quaternion.x = - 0.25 + Math.random() * 0.5;
		//group.quaternion.z = - 0.25 + Math.random() * 0.5;
		threeObject.parent.add(group);
		return group;
	}

}
