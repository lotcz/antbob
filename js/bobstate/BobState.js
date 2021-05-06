import * as THREE from '../../node_modules/three/build/three.module.js';

export const STATE_STANDING = 0;
export const STATE_IDLE = 1;
export const STATE_RUNNING = 2;
export const STATE_JUMPING = 3;
export const STATE_FALLING = 4;
export const STATE_RUNNING_BACKWARDS = 5;

export const ZERO_VECTOR = new THREE.Vector3(0, 0, 0);
export const X_AXIS = new THREE.Vector3(1, 0, 0);
export const Y_AXIS = new THREE.Vector3(0, 1, 0);
export const Z_AXIS = new THREE.Vector3(0, 0, 1);

export const ANIMATION_TRANSITION_DURATION = 300;
export const FRICTION_STATIC = 10;
export const FRICTION_MOVEMENT = 0;
export const MOVEMENT_SPEED = 4;

export class BobState {

	constructor(bob) {
		this.antbob = bob;
	}

	changeState(state_name) {
		this.antbob.changeState(state_name);
	}

	activate() {
	}

	deactivate() {
	}

	update(event) {
	}

}
