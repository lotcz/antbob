import {
	BobState,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_MOVEMENT,
	ZERO_VECTOR,
	WALKING_SPEED
} from './BobState.js';

const WALKING_ACCELERATION = 0.0045;
const WALKING_BACKWARDS_SPEED = WALKING_SPEED * 0.5;

export default class StateWalkingBackwards extends BobState {

	activate() {
		this.antbob.animation.activateAction('WalkingBackwards', ANIMATION_TRANSITION_DURATION, false);
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.isActionRequired() || (this.antbob.controls.isRunning() || !this.antbob.controls.moveBackward)) {
			this.yieldState();
			return;
		}

		if (this.antbob.speed < WALKING_BACKWARDS_SPEED) {
			this.antbob.speed += (event.delta * WALKING_ACCELERATION);
			this.antbob.speed = Math.min(WALKING_BACKWARDS_SPEED, this.antbob.speed);
		}

		if (this.antbob.speed > WALKING_BACKWARDS_SPEED) {
			this.antbob.speed = WALKING_BACKWARDS_SPEED;
		}

		const velocity = ZERO_VECTOR.clone();
		velocity.sub(this.antbob.direction).multiplyScalar(this.antbob.speed);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

}
