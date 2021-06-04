 import {
	BobState,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_MOVEMENT
} from './BobState.js';

export default class StateFalling extends BobState {

	activate() {
		this.antbob.animation.activateAction('Fall', ANIMATION_TRANSITION_DURATION, false);

		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);

		this.timeout = 300;
	}

	update(event) {
		if (this.timeout > 0) {
			this.timeout -= event.delta;
			return;
		}

		if (this.antbob.onGround) {
			this.yieldState();
		}
	}

}
