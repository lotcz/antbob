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
	X_AXIS,
	Y_AXIS,
	Z_AXIS
} from './BobState.js';

const JUMP_TIMEOUT = 300;
const JUMP_ENERGY = 500;
const JUMP_SPEED = 4;

export default class StateJumping extends BobState {

	activate() {
		this.antbob.onGround = false;
		this.antbob.animation.activateAction('Jump', ANIMATION_TRANSITION_DURATION * 0.5, false);

		if (this.antbob.controls.moveForward)
			this.jumpingDirection = this.antbob.direction;
		else if (this.antbob.controls.moveBackward)
			this.jumpingDirection = this.antbob.direction.clone().multiplyScalar(-1);
		else this.jumpingDirection = ZERO_VECTOR;

		this.jumping = JUMP_ENERGY;
		this.antbob.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.jumping <= 0) {
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

		this.jumping -= event.delta;
		this.antbob.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
		var velocity = ZERO_VECTOR.clone();
		velocity.add(Y_AXIS.clone().multiplyScalar(this.jumping / JUMP_ENERGY));
		/*
		if (this.antbob.controls.moveForward)
			this.jumpingDirection = this.antbob.direction;
		else if (this.antbob.controls.moveBackward)
			this.jumpingDirection = this.antbob.direction.clone().multiplyScalar(-1);
		*/
		velocity.add(this.jumpingDirection);
		velocity.multiplyScalar(JUMP_SPEED);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
	}

	deactivate() {
		this.antbob.jumpTimeout = JUMP_TIMEOUT;
	}

}
