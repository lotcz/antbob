import {
	BobState,
	ANIMATION_TRANSITION_DURATION,
	FRICTION_MOVEMENT,
	ZERO_VECTOR,
	WALKING_SPEED,
	Y_AXIS
} from './BobState.js';

const JUMP_TIMEOUT = 300;
const JUMP_TIME = 600;
const JUMP_ENERGY = 350;

const JUMP_SPEED_STANDING = 1;
const JUMP_SPEED_WALKING = 2.2;
const JUMP_SPEED_RUNNING = 5;

export default class StateJumping extends BobState {

	activate() {
		this.antbob.onGround = false;
		this.antbob.animation.activateAction('Jump', ANIMATION_TRANSITION_DURATION * 0.5, false);

		if (this.antbob.controls.moveForward)
			this.movementDirection = this.antbob.direction.clone();
		else if (this.antbob.controls.moveBackward)
			this.movementDirection = this.antbob.direction.clone().multiplyScalar(-1);
		else this.movementDirection = ZERO_VECTOR;

		var jumpSpeed = (this.antbob.speed > 0) ? ((this.antbob.speed > WALKING_SPEED) ? JUMP_SPEED_RUNNING : JUMP_SPEED_WALKING) : JUMP_SPEED_STANDING;
		this.movementDirection.multiplyScalar(jumpSpeed);

		this.jumpingDirection = Y_AXIS.clone();
		this.jumpingDirection.multiplyScalar(jumpSpeed);

		this.time = JUMP_TIME;
		this.energy = JUMP_ENERGY;

		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {
		if (this.time <= 0) {
			this.yieldState();
			return;
		}

		if (this.energy > 0) {
			if (this.antbob.controls.moveForward) {
				var velocity = ZERO_VECTOR.clone();
				velocity.add(this.movementDirection);
				velocity.add(this.jumpingDirection.clone().multiplyScalar(this.energy / JUMP_ENERGY));
				this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
			}
		}

		this.energy -= event.delta;
		this.time -= event.delta;
	}

	deactivate() {
		this.antbob.jumpTimeout = JUMP_TIMEOUT;
	}

}
