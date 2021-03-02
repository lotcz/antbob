export default class InteractionHelper {

	constructor(player, controls, antbob, ui) {
		this.player = player;
		this.controls = controls;
		this.userdata = player.userdata;
		this.antbob = antbob;
		this.ui = ui;

		this.target = null;
		this.maxDistance = 1.5;

		this.timeout = 0;
	}

	findNearest() {
		if (!this.antbob.dummy) return;

		var min, mi;
		for (var i = 0; i < this.userdata.userData.interaction.length; i++) {
			var udata = this.userdata.userData.interaction[i];
			var distance = this.antbob.dummy.position.distanceToSquared(udata.node.localToWorld(new THREE.Vector3(0, 0, 0)));
			var maxDistance = udata.data.maxDistance ? udata.data.maxDistance : this.maxDistance;
			if ((min === undefined || distance < min) && (distance < maxDistance)) {
				min = distance;
				mi = i;
			}
		}
		if (mi !== undefined) return this.userdata.userData.interaction[mi];
	}

	update(event) {
		var deltaTime = event.delta;

		if (this.controls.interact && this.target !== null && this.target.data.interact) {
			if (this.target.data.interact.type == 'exit') {
				this.ui.loadLevel(this.target.data.interact.level);
				return;
			} else if ((this.target.data.interact.type == 'talk')) {
				this.ui.showTalkDialog(this.target.data);
			} else if (this.target.data.interact.type == 'item') {
				this.antbob.setGun(this.target);
				this.ui.showActiveItem(this.target.data.name, this.target.data.interact.text);
				this.target.node.visible = false;
				this.target.data.interact = undefined;
			} else if (this.target.data.interact.type == 'vehicle') {
				this.antbob.setVehicle();
			}
			this.target = null;
			return;
		}

		if (this.timeout <= 0 && this.antbob.onGround) {
			this.timeout = 200;
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
