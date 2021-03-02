import * as THREE from '../node_modules/three/build/three.module.js';

import Vehicle from './vehicle.js';
import AnimationHelper from './animation.js';

const STATE_STANDING = 0;
const STATE_IDLE = 1;
const STATE_RUNNING = 2;
const STATE_JUMPING = 3;
const STATE_FALLING = 4;
const STATE_RUNNING_BACKWARDS = 5;
const IDLE_TIMEOUT = 3000;
const JUMP_TIMEOUT = 500;
const JUMP_ENERGY = 150;
const DUMMY_BODY_SIZE = 0.5;
const DEFAULT_MOVEMENT_SPEED = 0.5;
const DEFAULT_ROTATION_SPEED = 0.005;
const ZERO_VECTOR = new THREE.Vector3(0, 0, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

export default class AntBob {

	constructor(player, physics, controls, onloaded) {
		this.player = player;
		this.physics = physics;
		this.controls = controls;
		this.onLoaded = onloaded;

		this.reset();

		this.standingAnimation = new AnimationHelper(this.player, 'models/antbob-standing.gltf?v=2', (model) => this.onStandingAnimLoaded(model));
		this.runningAnimation = new AnimationHelper(this.player, 'models/antbob-running.gltf?v=2', (model) => this.onRunningAnimLoaded(model));
		this.idleAnimation = new AnimationHelper(this.player, 'models/antbob-idle.gltf?v=2', (model) => this.onIdleAnimLoaded(model));

		this.group = new THREE.Group();
		var entry = this.player.scene.getObjectByName('Exit');
		if (entry) {
			this.group.position.copy(entry.position);
			this.direction.applyQuaternion(entry.quaternion);
		}
		this.player.scene.add(this.group);

		this.loaded = false;
	}

	reset() {
		this.direction = X_AXIS.clone();
		this.onGround = true;
		this.state = STATE_STANDING;
		this.jumping = 0;
		this.jumpTimeout = 0;
		this.gun = null;
		this.firing = 0;
		this.idleTimeout = IDLE_TIMEOUT;
		this.jumpingDirection = null;
		this.collisionRequestSent = false;
		this.movementSpeed = DEFAULT_MOVEMENT_SPEED;
		this.rotationSpeed = DEFAULT_ROTATION_SPEED;
	}

	onRunningAnimLoaded(model) {
		this.runningModel = model;
		this.group.add(model);
		this.onAnimloaded();
	}

	onStandingAnimLoaded(model) {
		this.standingModel = model;
		this.group.add(model);
		this.onAnimloaded();
	}

	onIdleAnimLoaded(model) {
		this.idleModel = model;
		this.group.add(model);
		this.onAnimloaded();
	}

	onAnimloaded(model) {
		if (this.runningModel && this.idleModel && this.standingModel) {
			this.loaded = true;
			var radius = DUMMY_BODY_SIZE;
			//var shape = new Ammo.btSphereShape(radius);
			var shape = new Ammo.btBoxShape(new Ammo.btVector3(radius * 0.5, radius * 0.5, radius * 0.5));
			//this.dummy = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 3), new THREE.MeshBasicMaterial({color:0xFFFFFF}));
			this.dummy = new THREE.Mesh(new THREE.BoxGeometry(radius, radius, radius), new THREE.MeshBasicMaterial({color:0xFFFFFF}));
			this.dummy.position.copy(this.group.position);
			this.dummy.userData.antbob = true;
			//this.dummy.visible = false;
			this.body = this.physics.createRigidBody(this.dummy, shape, .05);
			this.body.setFriction(10);
			this.physics.addUserPointer(this.body, this.dummy);

			if (this.onLoaded) this.onLoaded();
		}
	}

	update(event) {
		if (!this.loaded) return;

		var deltaTime = event.delta;

		if (this.vehicle) {
			this.vehicle.animationFrame(deltaTime);
			return;
		}

		if (this.controls.moveLeft) this.direction.applyAxisAngle(Y_AXIS, this.rotationSpeed * deltaTime);
		if (this.controls.moveRight) this.direction.applyAxisAngle(Y_AXIS, - this.rotationSpeed * deltaTime);

		if (this.jumping <= 0) {
			if (this.lastDummyPosition) {
				var diff = this.lastDummyPosition.y - this.dummy.position.y;
				this.onGround = (diff < 0.01);
			}
		}

		this.lastDummyPosition = this.dummy.position.clone();

		var next = ZERO_VECTOR.clone();

		if (this.onGround) {
			this.jumping = 0;
			if (this.controls.moveForward)
				next = next.add(this.direction);
			else if (this.controls.moveBackward)
				next = next.sub(this.direction);

			if (this.controls.jump && this.jumpTimeout <= 0) {
				this.jumpingDirection = next;
				this.onGround = false;
				this.jumpTimeout = JUMP_TIMEOUT;
				this.jumping = JUMP_ENERGY;
			}
		}

		if (this.jumping > 0) {
			next.add(this.jumpingDirection);
			next.add(Y_AXIS.clone().multiplyScalar(this.jumping / JUMP_ENERGY));
			this.jumping -= deltaTime;
		 }

		if (this.jumpTimeout > 0) {
			this.jumpTimeout -= deltaTime;
		}

		var state = (this.onGround) ?
			(this.controls.moveForward || this.controls.moveBackward) ?
				(this.controls.moveForward) ?
					STATE_RUNNING :
					STATE_RUNNING_BACKWARDS :
				(this.state === STATE_IDLE) ?
					STATE_IDLE :
					STATE_STANDING :
			(this.jumping > 0) ?
				STATE_JUMPING :
				(this.controls.moveForward) ? STATE_RUNNING : STATE_FALLING;

		// go to running
		if (state === STATE_RUNNING && this.state !== STATE_RUNNING) {
			this.body.setFriction(0);
			//if (this.gun) this.gun.position.set(0, 0, -0.06);
			//if (this.gun) this.gun.quaternion.set(0.1, 0, 0, 1);
		}

		// go to running backwards
		if (state === STATE_RUNNING_BACKWARDS && this.state !== STATE_RUNNING_BACKWARDS) {
			this.body.setFriction(0);
			//if (this.gun) this.gun.position.set(0, 0, -0.06);
			//if (this.gun) this.gun.quaternion.set(0.1, 0, 0, 1);
		}

		// go to standing
		if (state === STATE_STANDING && this.state !== STATE_STANDING) {
			this.body.setFriction(5);
			this.idleTimeout = IDLE_TIMEOUT;
			//if (this.gun) this.gun.position.set(0, 0, 0);
			//if (this.gun) this.gun.quaternion.set(0, 0, 0, 1);
		}

		// go to falling
		if (state === STATE_FALLING && this.state !== STATE_FALLING) {
			this.body.setFriction(5);
			//if (this.gun) this.gun.position.set(0, 0, 0);
			//if (this.gun) this.gun.quaternion.set(0, 0, 0, 1);
		}

		// go to idle
		if (state === STATE_STANDING && (this.gun === null)) {
			if (this.idleTimeout <= 0 ) state = STATE_IDLE;
			this.idleTimeout -= deltaTime;
		}

		this.state = state;

		// SELECT ANIMATION AND MODEL
		var animation;

		if (this.state === STATE_RUNNING || this.state === STATE_JUMPING || this.state === STATE_RUNNING_BACKWARDS) {
			animation = this.runningAnimation;

			if (this.state === STATE_RUNNING_BACKWARDS)
				animation.playBackwards()
			else
				animation.playForward();

			// animate backpack
			if (this.gun) this.gun.position.y = 0.02 + Math.sin(event.time / 50) * 0.02;
		} else if (this.state === STATE_IDLE) {
			animation = this.idleAnimation;
		} else {
			animation = this.standingAnimation;
		}

		var model = animation.model;

		this.idleModel.visible = false;
		this.runningModel.visible = false;
		this.standingModel.visible = false;
		model.visible = true;

		// MODEL MOVEMENT
		this.group.position.x = this.dummy.position.x;
		this.group.position.z = this.dummy.position.z;
		this.group.position.y = this.dummy.position.y - (DUMMY_BODY_SIZE / 2);

		// MODEL ORIENTATION
		this.group.lookAt(this.group.position.clone().add(this.direction));

		// CAMERA
		if (this.player.camera.userData && this.player.camera.userData.type == "follow") {
			var pos = this.player.camera.userData.position;
			this.player.camera.position.set(this.group.position.x + pos.x, this.group.position.y + pos.y, this.group.position.z + pos.z);
		}
		this.player.camera.lookAt(this.group.position);

		// MODEL ANIMATION
		animation.update(event);

		// FIRE
		if (this.gun && this.controls.fire) {
			if (this.firing <= 0) {
				this.firing = 500;
				// fire
				var bulletSize = Math.max(Math.random(), 0.2) * 0.4;
				var bullet, bulletBody;
				var color = new THREE.Color(Math.random(), Math.random(), Math.random());
				var material = new THREE.MeshLambertMaterial({color:color});
				var random = Math.random();
				if (random < 0.33) {
					bullet = new THREE.Mesh(new THREE.IcosahedronGeometry(bulletSize, 3), material);
					bullet.position.set(this.dummy.position.x, this.dummy.position.y + (bulletSize) + 0.25, this.dummy.position.z);
					this.player.scene.add(bullet);
					bulletBody = this.physics.createRigidBodyFromSphere(bullet, bulletSize);
				} else if (random < 0.66) {
					bullet = new THREE.Mesh(new THREE.BoxGeometry(bulletSize, bulletSize, bulletSize), material);
					bullet.position.set(this.dummy.position.x, this.dummy.position.y + (bulletSize) + 0.25, this.dummy.position.z);
					this.player.scene.add(bullet);
					bulletBody = this.physics.createRigidBodyFromBox(bullet, bulletSize);
				} else {
					bullet = new THREE.Mesh(new THREE.CylinderGeometry(bulletSize * 0.5, bulletSize * 0.5, bulletSize), material);
					bullet.position.set(this.dummy.position.x, this.dummy.position.y + (bulletSize) + 0.25, this.dummy.position.z);
					this.player.scene.add(bullet);
					bulletBody = this.physics.createRigidBodyFromCylinder(bullet, bulletSize);
				}

				bulletBody.setFriction(0.3);

				var bulletVector = this.direction.clone();
				bulletVector.add(Y_AXIS).multiplyScalar(1.5);
				bulletBody.setLinearVelocity(new Ammo.btVector3(bulletVector.x, bulletVector.y, bulletVector.z));
				//bulletBody.setAngularVelocity(new Ammo.btVector3(bulletVector.x, bulletVector.y, bulletVector.z));
			}
		}

		if (this.firing > 0) {
			this.firing -= deltaTime;
		}

		//console.log(deltaTime);

		// PHYSICS MOVEMENT SIMULATION
		next.multiplyScalar(this.movementSpeed);
		if (this.jumping > 0) {
			next.multiplyScalar(1.5);
			this.body.setLinearVelocity(new Ammo.btVector3(next.x, next.y, next.z));
		}
		else if (this.onGround) this.body.setLinearVelocity(new Ammo.btVector3(next.x, next.y, next.z));
	}

	setGun(gundata) {
		if (this.gun) {
			this.group.remove(this.gun);
		}

		if (gundata) {
			var gunModel = gundata.node;
			if (gunModel) {
				this.gun = gunModel.clone();
				this.group.add(this.gun);
				this.gun.position.set(0, 0, 0);
			}
		} else {
			this.gun = null;
		}
	}

	setVehicle() {
		this.setGun(null);
		this.vehicle = new Vehicle(this.player);
		this.vehicle.createVehicle(new THREE.Vector3(0, 3, 0), new THREE.Quaternion(0, 0, 0, 1));
	}

}
