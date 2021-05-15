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
	X_AXIS,
	Y_AXIS,
	Y_AXIS_INVERTED,
	Z_AXIS,
	RUNNING_SPEED
} from './bobstate/BobState.js';

import StateStanding from './bobstate/StateStanding.js';
import StateRunning from './bobstate/StateRunning.js';
import StateRunningBackwards from './bobstate/StateRunningBackwards.js';
import StateJumping from './bobstate/StateJumping.js';
import StateIdle from './bobstate/StateIdle.js';
import StateFalling from './bobstate/StateFalling.js';
import StateWalking from './bobstate/StateWalking.js';
import StateWalkingBackwards from './bobstate/StateWalkingBackwards.js';

import Vehicle from './vehicle.js';
import AnimationHelper from './animation.js';
import SoundHelper from './sound.js';

const DUMMY_BODY_SIZE = 0.15;
const DUMMY_BODY_HEIGHT = 2.3 * DUMMY_BODY_SIZE;
const HEIGHT_DELTA = DUMMY_BODY_HEIGHT * 1.5;
const BOB_WEIGHT = 1;

const ROTATION_SPEED = 0.004;

export default class AntBob {

	constructor(player, onloaded) {
		this.player = player;
		this.story = player.story;
		this.physics = player.physics;
		this.controls = player.controls;
		this.onLoaded = onloaded;

		this.loaded = false;
		this.direction = X_AXIS.clone();
		this.onGround = true;
		this.jumpTimeout = 0;
		this.state = null;
		this.speed = 0;
		this.gun = null;
		this.firing = 0;
		this.collisionRequestSent = false;

		this.group = new THREE.Group();
		this.player.scene.add(this.group);

		var entry;
		if (this.story.getLastLevel()) {
			entry = this.player.scene.getObjectByName('Exit-' + this.story.getLastLevel());
		} else {
			entry = this.player.scene.getObjectByName('Start');
		}
		if (entry) {
			entry.getWorldPosition(this.group.position);
			this.direction.applyQuaternion(entry.quaternion);
		}

		this.animation = new AnimationHelper(this.player, 'models/antbob-animations.glb?v=10', (model) => this.onAnimationLoaded(model));

		// STATES
		this.states = []
		this.states[STATE_STANDING] = new StateStanding(this);
		this.states[STATE_IDLE] = new StateIdle(this);
		this.states[STATE_RUNNING] = new StateRunning(this);
		this.states[STATE_JUMPING] = new StateJumping(this);
		this.states[STATE_FALLING] = new StateFalling(this);
		this.states[STATE_RUNNING_BACKWARDS] = new StateRunningBackwards(this);
		this.states[STATE_WALKING] = new StateWalking(this);
		this.states[STATE_WALKING_BACKWARDS] = new StateWalkingBackwards(this);

		// SOUND
		this.dropSound = new SoundHelper('sound/jump_drop.ogg', false);
		this.shootSound = new SoundHelper('sound/shoot.ogg', false);
	}

	processMaterials(model) {
		const black = new THREE.MeshPhongMaterial({color:0x000000, shininess: 15, skinning:true});
		const white = new THREE.MeshBasicMaterial({color:0xF5F5F5, skinning:true});
		const green = new THREE.MeshLambertMaterial({color:0x0A3701, skinning:true});
		const blue = new THREE.MeshLambertMaterial({color:0x0117C1, skinning:true});

		model.traverse(function (object) {
			if (object.isMesh) {
				switch(object.name) {
					case "AntennaBulb":
					case "AntennaTentacle":
					case "Arm":
					case "Butt":
					case "Knee":
					case "Elbow":
					case "Head":
					case "Hand":
					case "Foot":
					case "LowerLeg":
						object.material = black;
						break;
					case "Torso":
					case "Sphere":
					case "Sleeve":
						object.material = green;
						break;
					case "Shorts":
						object.material = blue;
						break;
					case "Eye":
						object.material = white;
						break;
				}
			}
		});
	}

	onAnimationLoaded(model) {
		this.processMaterials(model);
		this.model = model;
		this.group.add(model);

		// BOX
		//var shape = new Ammo.btBoxShape(new Ammo.btVector3(DUMMY_BODY_SIZE / 2 , DUMMY_BODY_SIZE, DUMMY_BODY_SIZE / 2));
		//this.dummy = new THREE.Mesh(new THREE.BoxGeometry(DUMMY_BODY_SIZE, DUMMY_BODY_SIZE * 2, DUMMY_BODY_SIZE), new THREE.MeshBasicMaterial({color:0xFFFFFF}));

		// SPHERE
		//var shape = new Ammo.btSphereShape(DUMMY_BODY_SIZE);
		//this.dummy = new THREE.Mesh(new THREE.IcosahedronGeometry(DUMMY_BODY_SIZE, 3), new THREE.MeshBasicMaterial({color:0xFFFFFF}));

		// CAPSULE
		var shape = new Ammo.btCapsuleShape(DUMMY_BODY_SIZE, DUMMY_BODY_HEIGHT);
		var dummy1 = new THREE.Mesh(new THREE.IcosahedronGeometry(DUMMY_BODY_SIZE, 3), new THREE.MeshBasicMaterial({color:0xFFFFFF}));
		dummy1.position.y = - (DUMMY_BODY_HEIGHT / 2) - (DUMMY_BODY_SIZE / 2);
		var dummy2 = dummy1.clone();
		dummy2.position.y = (DUMMY_BODY_HEIGHT / 2) + (DUMMY_BODY_SIZE / 2);
		this.dummy = new THREE.Group();
		this.dummy.add(dummy1);
		this.dummy.add(dummy2);

		this.dummy.position.copy(this.group.position);
		this.dummy.userData.antbob = true;
		//this.player.scene.add(this.dummy);

		this.body = this.physics.createRigidBody(
			this.dummy,
			shape,
			{
				mass: BOB_WEIGHT,
				restitution: 0.5,
				angularDamping: 0.1,
				rollingFriction: 100
			}
		);
		this.physics.addUserPointer(this.body, this.dummy);

		this.changeState(STATE_STANDING);

		this.loaded = true;
		if (this.onLoaded) this.onLoaded();
	}

	changeState(state_name) {
		if (this.state) this.state.deactivate();
		this.state = this.states[state_name];
		this.state.activate();
	}

	update(event) {
		if (!this.loaded) return;

		var deltaTime = event.delta;

		if (this.vehicle) {
			this.vehicle.animationFrame(deltaTime);
			return;
		}

		if (this.controls.moveLeft) this.direction.applyAxisAngle(Y_AXIS, ROTATION_SPEED * deltaTime);
		if (this.controls.moveRight) this.direction.applyAxisAngle(Y_AXIS, - ROTATION_SPEED * deltaTime);

		// DETECT WHETHER ON GROUND
		var raycaster = new THREE.Raycaster(this.dummy.position, Y_AXIS_INVERTED, 0, HEIGHT_DELTA);
		var intersections = raycaster.intersectObjects(this.physics.allBodies, false);
		//this.player.scene.add(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000) );
		if (intersections.length > 0) {
			this.onGround = intersections[0].distance <= HEIGHT_DELTA;
		} else {
			this.onGround = false;
		}

		// MODEL MOVEMENT
		this.group.position.x = this.dummy.position.x;
		this.group.position.z = this.dummy.position.z;
		this.group.position.y = this.dummy.position.y - DUMMY_BODY_HEIGHT - 0.04;

		// MODEL ORIENTATION
		this.group.lookAt(this.group.position.clone().add(this.direction));
		//this.model.quaternion.set(this.dummy.quaternion.x, 0, this.dummy.quaternion.z, this.dummy.quaternion.w);


		// STAND UP
		var vector = new THREE.Vector3(this.dummy.quaternion.x, this.dummy.quaternion.y, this.dummy.quaternion.z);
		if (vector.length() > 0.001) {
			vector.multiplyScalar(-1);
			this.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
			this.body.applyTorqueImpulse(new Ammo.btVector3(vector.x, vector.y, vector.z));
			//if (this.onGround) this.body.applyCentralImpulse(new Ammo.btVector3(0, 0.1, 0));
		}

		// MODEL ANIMATION
		this.animation.update(event);

		// FIRE
		if (this.gun && this.controls.fire) {
			if (this.firing <= 0) {
				this.shootSound.play();
				this.firing = 500;
				var bulletSize = Math.max(Math.random(), 0.2) * 0.4;
				var objectData = { mass: bulletSize};
				var bullet, bulletBody;
				var color = new THREE.Color(Math.random(), Math.random(), Math.random());
				var material = new THREE.MeshLambertMaterial({color:color});
				var random = Math.random();
				if (random < 0.33) {
					bullet = new THREE.Mesh(new THREE.IcosahedronGeometry(bulletSize, 3), material);
					bullet.position.set(this.dummy.position.x, this.dummy.position.y + (bulletSize) + 0.25, this.dummy.position.z);
					this.player.scene.add(bullet);
					bulletBody = this.physics.createRigidBodyFromSphere(bullet, objectData);
				} else if (random < 0.66) {
					bullet = new THREE.Mesh(new THREE.BoxGeometry(bulletSize, bulletSize, bulletSize), material);
					bullet.position.set(this.dummy.position.x, this.dummy.position.y + (bulletSize) + 0.25, this.dummy.position.z);
					this.player.scene.add(bullet);
					bulletBody = this.physics.createRigidBodyFromBox(bullet, objectData);
				} else {
					bullet = new THREE.Mesh(new THREE.CylinderGeometry(bulletSize * 0.5, bulletSize * 0.5, bulletSize), material);
					bullet.position.set(this.dummy.position.x, this.dummy.position.y + (bulletSize) + 0.25, this.dummy.position.z);
					this.player.scene.add(bullet);
					bulletBody = this.physics.createRigidBodyFromCylinder(bullet, objectData);
				}

				bulletBody.setFriction(0.3);

				var bulletVector = this.direction.clone();
				bulletVector.add(Y_AXIS).multiplyScalar(5);
				bulletBody.setLinearVelocity(new Ammo.btVector3(bulletVector.x, bulletVector.y, bulletVector.z));
				//bulletBody.setAngularVelocity(new Ammo.btVector3(bulletVector.x, bulletVector.y, bulletVector.z));
			}
		}

		if (this.firing > 0) {
			this.firing -= deltaTime;
		}

		if (this.jumpTimeout > 0) {
			this.jumpTimeout -= deltaTime;
		}

		// STATE UPDATE
		this.state.update(event);
	}

	dropItem(slot) {
		if (this.gun) {
			this.gun.parent.remove(this.gun);
		}
		this.gun = null;
	}

	takeItem(node, data) {
		const slot = data.slot;
		this.player.ui.story.addInventoryItem(slot, data);

		node.parent.remove(node);
		node = node.clone();

		const boneName = slot == 'backpack' ? 'mixamorigSpine' : 'mixamorigLeftHand';
		const bone = this.model.getObjectByName(boneName);
		bone.add(node);
		console.log(bone, slot);
		node.position.set(0, 0, 0);

	}

	setVehicle() {
		this.setGun(null);
		this.vehicle = new Vehicle(this.player);
		this.vehicle.createVehicle(new THREE.Vector3(0, 3, 0), new THREE.Quaternion(0, 0, 0, 1));
	}

}
