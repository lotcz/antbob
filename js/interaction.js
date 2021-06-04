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
		this.justDropped = false;
	}

	findNearest() {
		if (!this.antbob.dummy) return;

		let min, mi;
		for (let i = 0; i < this.userdata.userData.interaction.length; i++) {
			let udata = this.userdata.userData.interaction[i];
			if (udata.node.visible) {
				const position = new THREE.Vector3();
				udata.node.getWorldPosition(position);
				const distance = this.antbob.dummy.position.distanceToSquared(position);
				const maxDistance = udata.data.maxDistance ? udata.data.maxDistance : DEFAULT_INTERACTION_DISTANCE;
				if ((min === undefined || distance < min) && (distance < maxDistance)) {
					min = distance;
					mi = i;
				}
			}
		}
		if (mi !== undefined) return this.userdata.userData.interaction[mi];
	}

	update(event) {
		const deltaTime = event.delta;

		if (this.controls.interact && this.target !== null && this.target.data.interact) {
			this.ui.hideInteraction();

			switch (this.target.data.interact.type) {
				case 'exit':
					this.ui.loadLevel(this.target.data.interact.level);
					break;
				case 'talk':
					this.ui.showTalkDialog(this.target.data);
					break;
				case 'item':
					if (!this.justDropped) {
						if (this.antbob.takeItem(this.target.data.interact)) {
							let node = this.target.node;
							node.parent.remove(node);
							this.player.physics.removeRigidBody(node);
							this.userdata.removeUserData('interaction', this.target);
						}
					}
					break;
				case 'vehicle':
					this.antbob.setVehicle();
					break;
				case 'toggle':
					this.ui.story.toggle(this.target.data.interact.accomplishment);
					break;
			}

			this.target = null;
			this.controls.interact = false;
			return;
		}

		if (this.controls.interact && this.antbob.hasItemInHands()) {
			const slot = this.antbob.story.hasInventoryItem('leftHand') ? 'leftHand' : 'rightHand';
			this.antbob.dropItem(slot);
			this.justDropped = true;
			return;
		}

		if (this.justDropped && !this.controls.interact) {
			this.justDropped = false;
		}

		if (this.timeout <= 0) {
			this.timeout = 200;
			if (!this.antbob.onGround) {
				this.target = null;
				this.ui.hideInteraction();
				return;
			}
			const nearest = this.findNearest(this.userdata);
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
