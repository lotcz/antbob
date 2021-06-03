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
		if (this.isActionRequired()) {
			this.yieldState();
			return;
		}

		if (!(this.antbob.controls.isRunning() && this.antbob.controls.moveForward)) {
			this.yieldState();
			return;
		}

		// animate backpack
		if (this.antbob.gun) this.antbob.gun.position.y = 0.02 + Math.sin(event.time / 50) * 0.02;

		if (this.antbob.speed < RUNNING_SPEED) {
			this.antbob.speed += (event.delta * RUNNING_ACCELERATION);
			this.antbob.speed = Math.min(RUNNING_SPEED, this.antbob.speed);
		}

		// PHYSICS MOVEMENT SIMULATION
		var velocity = ZERO_VECTOR.clone();
		velocity.add(this.antbob.direction);
		velocity.multiplyScalar(this.antbob.speed);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

}
