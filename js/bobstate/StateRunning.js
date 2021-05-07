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
	MOVEMENT_SPEED
} from './BobState.js';

const RUNNING_ACCELERATION = 0.0085;

export default class StateRunning extends BobState {

	activate() {
		this.antbob.animation.activateAction('Running', ANIMATION_TRANSITION_DURATION, false);
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);

		this.speed = 0;
	}

	update(event) {

		if (!this.antbob.onGround) {
			this.changeState(STATE_FALLING);
			return;
		}

		if (!this.antbob.controls.anyMovement()) {
			this.changeState(STATE_STANDING);
			return;
		}

		if (!this.antbob.controls.moveForward) {
			this.changeState(STATE_STANDING);
			return;
		}

		if (this.antbob.jumpTimeout <= 0 && this.antbob.controls.jump) {
			this.changeState(STATE_JUMPING);
			return;
		}

		// animate backpack
		if (this.antbob.gun) this.antbob.gun.position.y = 0.02 + Math.sin(event.time / 50) * 0.02;

		if (this.speed < MOVEMENT_SPEED) {
			this.speed += (event.delta * RUNNING_ACCELERATION);
			this.speed = Math.min(MOVEMENT_SPEED, this.speed);
		}

		// PHYSICS MOVEMENT SIMULATION
		var velocity = ZERO_VECTOR.clone();
		velocity.add(this.antbob.direction);
		velocity.multiplyScalar(this.speed);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

}
