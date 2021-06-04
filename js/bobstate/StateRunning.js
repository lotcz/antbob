import {
	BobState,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_MOVEMENT,
	ZERO_VECTOR,
	RUNNING_SPEED
} from './BobState.js';

const RUNNING_ACCELERATION = 0.0085;

export default class StateRunning extends BobState {

	activate() {
		this.antbob.animation.activateAction('Running', ANIMATION_TRANSITION_DURATION, false);
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.isActionRequired() || (!(this.antbob.controls.isRunning() && this.antbob.controls.moveForward))) {
			this.yieldState();
			return;
		}

		if (this.antbob.speed < RUNNING_SPEED) {
			this.antbob.speed += (event.delta * RUNNING_ACCELERATION);
			this.antbob.speed = Math.min(RUNNING_SPEED, this.antbob.speed);
		}

		var velocity = ZERO_VECTOR.clone();
		velocity.add(this.antbob.direction);
		velocity.multiplyScalar(this.antbob.speed);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

}
