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
	ZERO_VECTOR,
	X_AXIS,
	Y_AXIS,
	Z_AXIS
} from './BobState.js';

const IDLE_TIMEOUT = 3000;

export default class StateStanding extends BobState {

	activate() {
		const animName = this.antbob.hasItemInBothHands() ? 'StandingHolding' : 'Stand';
		this.antbob.animation.activateAction(animName, ANIMATION_TRANSITION_DURATION * 0.5, false);
		this.idleTimeout = IDLE_TIMEOUT;
		this.antbob.body.setFriction(FRICTION_STATIC);
		this.antbob.body.setRollingFriction(10);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
		//athis.antbob.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
		this.antbob.speed = 0;
	}

	update(event) {
		if (this.isActionRequired() || this.antbob.controls.anyMovement()) {
			this.yieldState();
			return;
		}

		if (this.idleTimeout <= 0 && !this.antbob.hasItemInBothHands()) {
			this.changeState(STATE_IDLE);
			return;
		}

		this.idleTimeout -= event.delta;
	}

}
