import {
	BobState,
	STATE_IDLE,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_STATIC
} from './BobState.js';

const IDLE_TIMEOUT = 3000;

export default class StateStanding extends BobState {

	activate() {
		this.bothHands = this.antbob.hasItemInBothHands();
		this.antbob.animation.activateAction(this.bothHands ? 'StandingHolding' : 'Stand', ANIMATION_TRANSITION_DURATION * 0.5, false);
		this.idleTimeout = IDLE_TIMEOUT;
		this.antbob.body.setFriction(FRICTION_STATIC);
		this.antbob.body.setRollingFriction(10);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
		this.antbob.speed = 0;
	}

	update(event) {
		if (this.isActionRequired() || this.antbob.controls.anyMovement() || this.bothHands != this.antbob.hasItemInBothHands()) {
			this.yieldState();
			return;
		}

		if (this.idleTimeout <= 0 && !this.antbob.hasItemInBothHands()) {
			this.changeState(STATE_IDLE);
			return;
		}

		this.idleTimeout -= event.delta;
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
	}

}
