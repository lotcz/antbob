import {
	BobState,
	STATE_STANDING,
	STATE_IDLE,
	STATE_RUNNING,
	STATE_JUMPING,
	STATE_FALLING,
	STATE_RUNNING_BACKWARDS,
	ANIMATION_TRANSITION_DURATION,
	STATE_WALKING,
	STATE_WALKING_BACKWARDS,
	FRICTION_STATIC,
	FRICTION_MOVEMENT,
	ZERO_VECTOR,
	WALKING_SPEED
} from './BobState.js';

const WALKING_ACCELERATION = 0.0045;

export default class StateWalking extends BobState {

	activate() {
		const animName = this.antbob.hasItemInBothHands() ? 'WalkingHolding' : 'Walking';
		this.antbob.animation.activateAction(animName, ANIMATION_TRANSITION_DURATION * 2, false);
		this.antbob.animation.speed = 1.2;
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.isActionRequired()) {
			this.yieldState();
			return;
		}

		if (this.antbob.controls.isRunning() || !this.antbob.controls.moveForward) {
			this.yieldState();
			return;
		}

		if (this.antbob.speed < WALKING_SPEED) {
			this.antbob.speed += (event.delta * WALKING_ACCELERATION);
			this.antbob.speed = Math.min(WALKING_SPEED, this.antbob.speed);
		}

		if (this.antbob.speed > WALKING_SPEED) {
			this.antbob.speed = WALKING_SPEED;
		}

		// PHYSICS MOVEMENT SIMULATION
		var velocity = ZERO_VECTOR.clone();
		velocity.add(this.antbob.direction);
		velocity.multiplyScalar(this.antbob.speed);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

	deactivate() {
		this.antbob.animation.speed = 1;
	}

}
