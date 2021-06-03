import {
	BobState,
	STATE_STANDING,
	STATE_IDLE,
	STATE_RUNNING,
	STATE_JUMPING,
	STATE_FALLING,
	STATE_RUNNING_BACKWARDS,
	STATE_WALKING,
	STATE_WALKING_BACKWARDS,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_STATIC,
	FRICTION_MOVEMENT,
	ZERO_VECTOR
} from './BobState.js';

export default class StateIdle extends BobState {

	activate(bob) {
		this.antbob.animation.activateAction('Idle', ANIMATION_TRANSITION_DURATION, false);

		this.antbob.body.setFriction(FRICTION_STATIC);
		this.antbob.body.setRollingFriction(1);
	}

	update(event) {
		if (this.isActionRequired() || this.antbob.controls.anyMovement()) {
			this.yieldState();
			return;
		}
	}

}
