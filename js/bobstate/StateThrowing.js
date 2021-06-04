 import {
	BobState,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_STATIC,
} from './BobState.js';

const HOLD_TIMEOUT = 800;
const FIRE_TIMEOUT = 2000;

export default class StateThrowing extends BobState {

	activate() {
		this.slot = this.antbob.story.hasInventoryItem('leftHand') ? 'leftHand' : (this.antbob.story.hasInventoryItem('rightHand') ? 'rightHand' : false);
		if (!this.slot) {
			this.yieldState();
			return;
		}

		this.antbob.animation.activateAction(this.slot === 'leftHand' ? 'ThrowLeft' : 'Throw', ANIMATION_TRANSITION_DURATION, false);
		this.antbob.body.setFriction(FRICTION_STATIC);
		this.antbob.body.setRollingFriction(0);
		this.timeout = FIRE_TIMEOUT;
		this.antbob.firing = FIRE_TIMEOUT;
		this.holdTimeout = HOLD_TIMEOUT;
		this.fired = false;
	}

	update(event) {
		if (this.isFallRequired()) {
			this.yieldState();
			return;
		}

		if (this.holdTimeout > 0) {
			if (!this.antbob.controls.fire) {
				const power = 1 - (this.holdTimeout / HOLD_TIMEOUT);
				this.antbob.throwItem(this.slot, power);
			}
			this.holdTimeout -= event.delta;
			return;
		}

		if (!this.fired) {
			this.antbob.throwItem(this.slot, 1);
			this.fired = true;
		}

		if (this.antbob.controls.anyMovement()) {
			this.yieldState();
			return;
		}

		if (this.timeout > 0) {
			this.timeout -= event.delta;
			return;
		}

		this.yieldState();
	}

}
