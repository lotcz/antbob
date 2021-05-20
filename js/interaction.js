const DEFAULT_INTERACTION_DISTANCE = 0.75;

export default class InteractionHelper {

	constructor(player, controls, antbob, ui) {
		this.player = player;
		this.controls = controls;
		this.userdata = player.userdata;
		this.antbob = antbob;
		this.ui = ui;

		this.target = null;
		this.timeout = 0;
	}

	findNearest() {
		if (!this.antbob.dummy) return;

		var min, mi;
		for (var i = 0; i < this.userdata.userData.interaction.length; i++) {
			var udata = this.userdata.userData.interaction[i];
			if (udata.node.visible) {
				var distance = this.antbob.dummy.position.distanceToSquared(udata.node.localToWorld(new THREE.Vector3(0, 0, 0)));
				var maxDistance = udata.data.maxDistance ? udata.data.maxDistance : DEFAULT_INTERACTION_DISTANCE;
				if ((min === undefined || distance < min) && (distance < maxDistance)) {
					min = distance;
					mi = i;
				}
			}
		}
		if (mi !== undefined) return this.userdata.userData.interaction[mi];
	}

	update(event) {
		var deltaTime = event.delta;

		if (this.controls.interact && this.target !== null && this.target.data.interact) {
			this.ui.hideInteraction();

			if (this.target.data.interact.type == 'exit') {
				this.ui.loadLevel(this.target.data.interact.level);
				return;
			}

			if ((this.target.data.interact.type == 'talk')) {
				this.ui.showTalkDialog(this.target.data);
			} else if (this.target.data.interact.type == 'item') {
				if (this.antbob.takeItem(this.target.data.interact)) {
					let node = this.target.node;
					node.parent.remove(node);
					this.userdata.removeUserData('interaction', this.target);
				}
			} else if (this.target.data.interact.type == 'vehicle') {
				this.antbob.setVehicle();
			}

			if (this.target.data.interact && this.target.data.interact.type == 'toggle') {
				this.ui.story.toggle(this.target.data.interact.accomplishment);
			}

			this.target = null;
			this.controls.interact = false;
			return;
		}

		if (this.timeout <= 0) {
			this.timeout = 200;
			if (!this.antbob.onGround) {
				this.target = null;
				this.ui.hideInteraction();
				return;
			}
			var nearest = this.findNearest(this.userdata);
			if (nearest) {
				if (nearest !== this.target) {
					this.target = nearest;
					this.ui.showInteraction(nearest.data);
				}
			} else {
				this.target = null;
				this.ui.hideInteraction();
			}
		} else this.timeout -= deltaTime;
	}

}
