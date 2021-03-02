export default class Vehicle {

	constructor(player) {
		this.player = player;
		this.scene = player.scene;
		this.physics = player.physics;
		this.controls = player.controls;

		this.chassisWidth = 2;
		this.chassisHeight = 0.5;
		this.chassisLength = 4;
		this.massVehicle = 5;

		this.wheelAxisPositionBack = -1;
		this.wheelRadiusBack = 0.5;
		this.wheelWidthBack = .5;
		this.wheelHalfTrackBack = 1;
		this.wheelAxisHeightBack = -0.2;

		this.wheelAxisFrontPosition = 1;
		this.wheelHalfTrackFront = 1;
		this.wheelAxisHeightFront = -0.2;
		this.wheelRadiusFront = 0.5;
		this.wheelWidthFront = .5;

		this.friction = 3000;
		this.suspensionStiffness = 20.0;
		this.suspensionDamping = 2.3;
		this.suspensionCompression = 4.4;
		this.suspensionRestLength = 0.6;
		this.rollInfluence = 0.2;

		this.steeringIncrement = .03;
		this.steeringClamp = .4;
		this.maxEngineForce = 3;
		this.maxBreakingForce = 6;

		// Wheels
		this.FRONT_LEFT = 0;
		this.FRONT_RIGHT = 1;
		this.BACK_LEFT = 2;
		this.BACK_RIGHT = 3;
		this.wheelMeshes = [];
		this.wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
		this.wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

		this.body = null;
		this.materialDynamic = new THREE.MeshPhongMaterial( { color:0xfca400 } );
		this.materialStatic = new THREE.MeshPhongMaterial( { color:0x999999 } );
		this.materialInteractive = new THREE.MeshPhongMaterial( { color:0x990000 } );

		this.speedometer = document.getElementById('speedometer');
		this.speedometer.style.display = 'block';
	}

	update(event) {
		var deltaTime = event.delta;
		this.animationFrame(deltaTime);
		this.player.camera.lookAt(vehicle.chassisMesh.position);
	}

	createWheelMesh(radius, width) {
		var geometry = new THREE.CylinderGeometry(radius, radius, width, 24, 1);
		geometry.rotateZ(Math.PI / 2);
		var mesh = new THREE.Mesh(geometry, this.materialDynamic);
		mesh.add(new THREE.Mesh(new THREE.BoxGeometry(width * 1.5, radius * 1.75, radius*.25, 1, 1, 1), this.materialStatic));
		this.scene.add(mesh);
		return mesh;
	}

	createChassisMesh(w, l, h) {
		var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
		var mesh = new THREE.Mesh(shape, this.materialInteractive);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.add(new THREE.Mesh(new THREE.BoxGeometry(w * .75, 1, 2, 1, 1, 1), this.materialStatic))
		this.scene.add(mesh);
		return mesh;
	}

	addWheel(isFront, pos, radius, width, index) {
		var wheelInfo = this.vehicle.addWheel(
			pos,
			this.wheelDirectionCS0,
			this.wheelAxleCS,
			this.suspensionRestLength,
			radius,
			this.tuning,
			isFront
		);

		wheelInfo.set_m_suspensionStiffness(this.suspensionStiffness);
		wheelInfo.set_m_wheelsDampingRelaxation(this.suspensionDamping);
		wheelInfo.set_m_wheelsDampingCompression(this.suspensionCompression);
		wheelInfo.set_m_frictionSlip(this.friction);
		wheelInfo.set_m_rollInfluence(this.rollInfluence);

		this.wheelMeshes[index] = this.createWheelMesh(radius, width);
	}

	createVehicle(pos, quat) {

		// Chassis
	 	this.chassisMesh = this.createChassisMesh(this.chassisWidth, this.chassisHeight, this.chassisLength);
		var geometry = new Ammo.btBoxShape(new Ammo.btVector3(this.chassisWidth * .5, this.chassisHeight * .5, this.chassisLength * .5));
		this.body = this.physics.createRigidBody(this.chassisMesh, geometry, this.massVehicle);

		// Raycast Vehicle
		this.engineForce = 0;
		this.vehicleSteering = 0;
		this.breakingForce = 0;
		this.tuning = new Ammo.btVehicleTuning();
		this.rayCaster = new Ammo.btDefaultVehicleRaycaster(this.physics.physicsWorld);
		this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.body, this.rayCaster);
		this.vehicle.setCoordinateSystem(0, 1, 2);
		this.physics.physicsWorld.addAction(this.vehicle);

		this.addWheel(true, new Ammo.btVector3(this.wheelHalfTrackFront, this.wheelAxisHeightFront, this.wheelAxisFrontPosition), this.wheelRadiusFront, this.wheelWidthFront, this.FRONT_LEFT);
		this.addWheel(true, new Ammo.btVector3(-this.wheelHalfTrackFront, this.wheelAxisHeightFront, this.wheelAxisFrontPosition), this.wheelRadiusFront, this.wheelWidthFront, this.FRONT_RIGHT);
		this.addWheel(false, new Ammo.btVector3(-this.wheelHalfTrackBack, this.wheelAxisHeightBack, this.wheelAxisPositionBack), this.wheelRadiusBack, this.wheelWidthBack, this.BACK_LEFT);
		this.addWheel(false, new Ammo.btVector3(this.wheelHalfTrackBack, this.wheelAxisHeightBack, this.wheelAxisPositionBack), this.wheelRadiusBack, this.wheelWidthBack, this.BACK_RIGHT);
	}

	animationFrame(dt) {
		var speed = this.vehicle.getCurrentSpeedKmHour();

		if (this.speedometer) this.speedometer.innerHTML = (speed < 0 ? '(R) ' : '') + Math.abs(speed).toFixed(1) + ' km/h';

		this.breakingForce = 0;
		this.engineForce = 0;

		if (this.controls.moveForward) {
			if (this.speed < -1)
				this.breakingForce = this.maxBreakingForce;
			else this.engineForce = this.maxEngineForce;
		}
		if (this.controls.moveBackward) {
			if (this.speed > 1)
				this.breakingForce = this.maxBreakingForce;
			else this.engineForce = -this.maxEngineForce / 2;
		}
		if (this.controls.moveLeft) {
			if (this.vehicleSteering < this.steeringClamp)
				this.vehicleSteering += this.steeringIncrement;
		}
		else {
			if (this.controls.moveRight) {
				if (this.vehicleSteering > -this.steeringClamp)
					this.vehicleSteering -= this.steeringIncrement;
			}
			else {
				if (this.vehicleSteering < -this.steeringIncrement)
					this.vehicleSteering += this.steeringIncrement;
				else {
					if (this.vehicleSteering > this.steeringIncrement)
						this.vehicleSteering -= this.steeringIncrement;
					else {
						this.vehicleSteering = 0;
					}
				}
			}
		}

		this.vehicle.applyEngineForce(this.engineForce, this.BACK_LEFT);
		this.vehicle.applyEngineForce(this.engineForce, this.BACK_RIGHT);

		this.vehicle.setBrake(this.breakingForce / 2, this.FRONT_LEFT);
		this.vehicle.setBrake(this.breakingForce / 2, this.FRONT_RIGHT);
		this.vehicle.setBrake(this.breakingForce, this.BACK_LEFT);
		this.vehicle.setBrake(this.breakingForce, this.BACK_RIGHT);

		this.vehicle.setSteeringValue(this.vehicleSteering, this.FRONT_LEFT);
		this.vehicle.setSteeringValue(this.vehicleSteering, this.FRONT_RIGHT);

		var tm, p, q, i;
		var n = this.vehicle.getNumWheels();
		for (i = 0; i < n; i++) {
			this.vehicle.updateWheelTransform(i, true);
			tm = this.vehicle.getWheelTransformWS(i);
			p = tm.getOrigin();
			q = tm.getRotation();
			this.wheelMeshes[i].position.set(p.x(), p.y(), p.z());
			this.wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
		}

		tm = this.vehicle.getChassisWorldTransform();
		p = tm.getOrigin();
		q = tm.getRotation();
		this.chassisMesh.position.set(p.x(), p.y(), p.z());
		this.chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w());

		if (this.player.camera.userData && this.player.camera.userData.type == "follow") {
			var pos = this.player.camera.userData.position;
			this.player.camera.position.set(this.chassisMesh.position.x + pos.x, this.chassisMesh.position.y + pos.y, this.chassisMesh.position.z + pos.z);
		}
		this.player.camera.lookAt(this.chassisMesh.position);
	}

}
