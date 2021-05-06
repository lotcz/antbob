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

export default class StateIdle extends BobState {

	activate(bob) {
		this.antbob.animation.activateAction('Idle', ANIMATION_TRANSITION_DURATION, false);
	}

	update(event) {
		if (this.antbob.controls.moveForward) {
			this.changeState(STATE_RUNNING);
			return;
		} else if (this.antbob.controls.moveBackward) {
			this.changeState(STATE_RUNNING_BACKWARDS);
			return;
		}

		if (this.antbob.controls.jump) {
			this.changeState(STATE_JUMPING);
			return;
		}
	}

	getFriction() {
		return FRICTION_STATIC;
	}

}
