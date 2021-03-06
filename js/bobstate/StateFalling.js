 import {
	BobState,
	STATE_STANDING,
	STATE_IDLE,
	STATE_RUNNING,
	STATE_JUMPING,
	STATE_FALLING,
	STATE_RUNNING_BACKWARDS,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_STATIC,
	FRICTION_MOVEMENT,
	ZERO_VECTOR
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
			if (this.antbob.controls.moveForward) {
				this.changeState(STATE_RUNNING);
			} else if (this.antbob.controls.moveBackward) {
				this.changeState(STATE_RUNNING_BACKWARDS);
			} else {
				this.changeState(STATE_STANDING);
			}
		}
	}

}
