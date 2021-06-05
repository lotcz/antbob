import {
	BobState,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_MOVEMENT,
	ZERO_VECTOR,
	RUNNING_SPEED
} from './BobState.js';

const RUNNING_BACKWARDS_SPEED = RUNNING_SPEED * 0.4;

export default class StateRunningBackwards extends BobState {

	activate() {
		this.antbob.animation.activateAction('Backwards', ANIMATION_TRANSITION_DURATION, false);
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.isActionRequired() || (!(this.antbob.controls.isRunning() && this.antbob.controls.moveBackward)) || this.antbob.hasItemInBothHands()) {
			this.yieldState();
			return;
		}

		if (this.antbob.speed < RUNNING_BACKWARDS_SPEED) {
			this.antbob.speed += (event.delta * RUNNING_BACKWARDS_SPEED);
			this.antbob.speed = Math.min(RUNNING_BACKWARDS_SPEED, this.antbob.speed);
		}

		if (this.antbob.speed > RUNNING_BACKWARDS_SPEED) {
			this.antbob.speed = RUNNING_BACKWARDS_SPEED;
		}

		var velocity = ZERO_VECTOR.clone();
		velocity.sub(this.antbob.direction).multiplyScalar(this.antbob.speed);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

}
