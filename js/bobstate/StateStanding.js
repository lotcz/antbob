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
	ZERO_VECTOR,
	X_AXIS,
	Y_AXIS,
	Z_AXIS
} from './BobState.js';

const IDLE_TIMEOUT = 3000;

export default class StateStanding extends BobState {

	activate() {
		this.antbob.animation.activateAction('Stand', ANIMATION_TRANSITION_DURATION * 0.3, false);
		this.idleTimeout = IDLE_TIMEOUT;
		this.antbob.body.setFriction(FRICTION_STATIC);
		this.antbob.body.setRollingFriction(1);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
		this.antbob.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
	}

	update(event) {
		if (this.antbob.controls.moveForward) {
			this.changeState(STATE_RUNNING);
			return;
		}

		if (this.antbob.controls.moveBackward) {
			this.changeState(STATE_RUNNING_BACKWARDS);
			return;
		}

		if (this.antbob.jumpTimeout <= 0 && this.antbob.controls.jump) {
			this.changeState(STATE_JUMPING);
			return;
		}

		// go to idle
		if (this.idleTimeout <= 0 ) {
			this.changeState(STATE_IDLE);
			return;
		}

		this.idleTimeout -= event.delta;

	}

}
