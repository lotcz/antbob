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
	MOVEMENT_SPEED,
	X_AXIS,
	Y_AXIS,
	Z_AXIS
} from './BobState.js';

const JUMP_TIMEOUT = 300;
const JUMP_TIME = 600;
const JUMP_ENERGY = 350;
const JUMP_SPEED = 5;

export default class StateJumping extends BobState {

	activate() {
		this.antbob.onGround = false;
		this.antbob.animation.activateAction('Jump', ANIMATION_TRANSITION_DURATION * 0.5, false);

		if (this.antbob.controls.moveForward)
			this.movementDirection = this.antbob.direction.clone();
		else if (this.antbob.controls.moveBackward)
			this.movementDirection = this.antbob.direction.clone().multiplyScalar(-1);
		else this.movementDirection = ZERO_VECTOR;

		this.movementDirection.multiplyScalar(MOVEMENT_SPEED);

		this.jumpingDirection = Y_AXIS.clone();
		this.jumpingDirection.multiplyScalar(JUMP_SPEED);

		this.time = JUMP_TIME;
		this.energy = JUMP_ENERGY;
		this.antbob.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.time <= 0) {
			if (!this.antbob.onGround) {
				this.changeState(STATE_FALLING);
				return;
			}

			if (this.antbob.controls.moveForward) {
				this.changeState(STATE_RUNNING);
				return;
			}

			if (this.antbob.controls.moveBackward) {
				this.changeState(STATE_RUNNING_BACKWARDS);
				return;
			}

			this.changeState(STATE_STANDING);
			return;
		}

		if (this.energy > 0) {
			var velocity = ZERO_VECTOR.clone();
			velocity.add(this.movementDirection);
			velocity.add(this.jumpingDirection.clone().multiplyScalar(this.energy / JUMP_ENERGY));
			this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
		}

		this.energy -= event.delta;
		this.time -= event.delta;
	}

	deactivate() {
		this.antbob.jumpTimeout = JUMP_TIMEOUT;
	}

}
