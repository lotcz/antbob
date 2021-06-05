import {
	BobState,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_MOVEMENT,
	ZERO_VECTOR,
	WALKING_SPEED
} from './BobState.js';

const WALKING_ACCELERATION = 0.0045;

export default class StateWalking extends BobState {

	activate() {
		this.bothHands = this.antbob.hasItemInBothHands();
		this.antbob.animation.activateAction(this.bothHands ? 'WalkingHolding' : 'Walking', ANIMATION_TRANSITION_DURATION * 2, false);
		this.antbob.animation.speed = 1.2;
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.isActionRequired() || this.antbob.controls.isRunning() || !this.antbob.controls.moveForward || this.bothHands != this.antbob.hasItemInBothHands()) {
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

		const velocity = ZERO_VECTOR.clone();
		velocity.add(this.antbob.direction);
		velocity.multiplyScalar(this.antbob.speed);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

	deactivate() {
		this.antbob.animation.speed = 1;
	}

}
