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

export default class StateRunningBackwards extends BobState {

	activate() {
		this.antbob.animation.activateAction('Backwards', ANIMATION_TRANSITION_DURATION, false);
		this.antbob.animation.speed = 1.5;
		this.antbob.body.setFriction(FRICTION_MOVEMENT);
		this.antbob.body.setRollingFriction(0);
	}

	update(event) {

		if (!this.antbob.onGround) {
			this.antbob.changeState(STATE_FALLING);
			return;
		}

		if (!this.antbob.controls.anyMovement()) {
			this.antbob.changeState(STATE_STANDING);
			return;
		}

		if (!this.antbob.controls.moveBackward) {
			if (this.antbob.controls.run ^ this.antbob.controls.caps)
				this.changeState(STATE_RUNNING);
			else
				this.changeState(STATE_WALKING);
			return;
		}

		if (!(this.antbob.controls.run ^ this.antbob.controls.caps)) {
			this.changeState(STATE_WALKING_BACKWARDS);
			return;
		}

		// animate backpack
		if (this.antbob.gun) this.antbob.gun.position.y = 0.02 + Math.sin(event.time / 50) * 0.02;

		// PHYSICS MOVEMENT SIMULATION
		var velocity = this.getVelocity(event);
		this.antbob.body.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
		this.antbob.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
	}

	getVelocity(event) {
		var next = ZERO_VECTOR.clone();
		next.sub(this.antbob.direction).multiplyScalar(RUNNING_SPEED);
		return next;
	}

	deactivate() {
		this.antbob.animation.speed = 1;
	}

}
