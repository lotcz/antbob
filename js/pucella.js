import AnimationHelper from "./animation.js";

export default class Pucella {

	constructor(player) {
		this.player = player;
	}

	async load(threeObject, data) {
		this.animation = new AnimationHelper(this.player, 'models/pucella.glb');
		this.model = await this.animation.load();
		this.model.position.copy(threeObject.position);
		this.model.quaternion.copy(threeObject.quaternion);
		this.model.scale.copy(threeObject.scale);
		threeObject.parent.add(this.model);
	}

	update(event) {
		this.animation.update(event);
	}

}
