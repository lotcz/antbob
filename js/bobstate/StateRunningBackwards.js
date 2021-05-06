import * as THREE from '../../node_modules/three/build/three.module.js';

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

export default class StateRunningBackwards extends BobState {

	activate() {
		this.antbob.animation.activateAction('Backwards', ANIMATION_TRANSITION_DURATION, false);
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

		if (this.antbob.controls.moveForward && !this.antbob.controls.moveBackward) {
			this.antbob.changeState(STATE_RUNNING);
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
		next.sub(this.antbob.direction).multiplyScalar(MOVEMENT_SPEED);
		return next;
	}

	getFriction() {
		return FRICTION_MOVEMENT;
	}

}
