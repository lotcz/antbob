const DISABLE_DEACTIVATION = 4;
const STEP_SIMULATION = 1;
const DEFAULT_GRAVITY = -9.8;
const DEFAULT_MARGIN = 0.001;

export default class PhysicsHelper {

	constructor(player, gravity, margin) {
		this.player = player;
		this.scene = player.scene;

		const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		this.dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		const broadphase = new Ammo.btDbvtBroadphase();
		const solver = new Ammo.btSequentialImpulseConstraintSolver();
		//const softBodySolver = new Ammo.btDefaultSoftBodySolver();
		//physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
		this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, broadphase, solver, collisionConfiguration);

		if (gravity === undefined) gravity = new Ammo.btVector3(0, DEFAULT_GRAVITY, 0);
		this.physicsWorld.setGravity(gravity);

		//physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3( 0, gravityConstant, 0));

		this.transformAux1 = new Ammo.btTransform();
		//this.softBodyHelpers = new Ammo.btSoftBodyHelpers();

		this.rigidBodies = [];

		if (margin === undefined) margin = DEFAULT_MARGIN;
		this.margin = margin;

		// this disables collision detection for now
		this.bobCollided = true;

		if (player.userdata) this.processUserData(player.userdata);
	}

	processUserData(userdata) {
		for (var i = 0; i < userdata.userData.physics.length; i++) {
			var udata = userdata.userData.physics[i];
			if (udata.data.type == 'rigidBox')
				this.createRigidBodyFromBox(udata.node, udata.data.mass);
			if (udata.data.type == 'rigidSphere')
				this.createRigidBodyFromSphere(udata.node, udata.data.mass);
			if (udata.data.type == 'rigidOctahedron')
				this.createRigidBodyFromOctahedron(udata.node, udata.data.mass);
			if (udata.data.type == 'rigidCylinder')
				this.createRigidBodyFromCylinder(udata.node, udata.data.mass);
		}
	}

	createRigidBodyFromBox(threeObject, mass) {
		var shape = new Ammo.btBoxShape(
			new Ammo.btVector3(
				threeObject.geometry.parameters.width * threeObject.scale.x * 0.5,
				threeObject.geometry.parameters.height * threeObject.scale.y * 0.5,
				threeObject.geometry.parameters.depth * threeObject.scale.z * 0.5
			)
		);
		var body = this.createRigidBody(threeObject, shape, mass);
		return body;
	}

	createRigidBodyFromSphere(threeObject, mass) {
		var shape = new Ammo.btSphereShape(threeObject.geometry.parameters.radius * threeObject.scale.x);
		return this.createRigidBody(threeObject, shape, mass);
	}

	createRigidBodyFromCylinder(threeObject, mass) {
		let radiusTop = threeObject.geometry.parameters.radiusTop * threeObject.scale.x;
		let radiusBottom = threeObject.geometry.parameters.radiusBottom * threeObject.scale.x;
		let height = threeObject.geometry.parameters.height * threeObject.scale.y;
		var shape = new Ammo.btCylinderShape(new Ammo.btVector3(radiusTop, height * 0.5, radiusBottom));
		return this.createRigidBody(threeObject, shape, mass);
	}

	createRigidBodyFromOctahedron(threeObject, mass) {
		var shape = new Ammo.btSphereShape(threeObject.geometry.parameters.radius * threeObject.scale.x);
		return this.createRigidBody(threeObject, shape, mass);
	}

	// Set pointer back to the three object
	addUserPointer(body, threeObject) {
		const btVecUserData = new Ammo.btVector3( 0, 0, 0 );
		btVecUserData.threeObject = threeObject;
		body.setUserPointer( btVecUserData );
	}

	createRigidBody(threeObject, physicsShape, mass) {
		if (threeObject.parent && threeObject.parent !== this.scene) {
			threeObject.parent.updateWorldMatrix();
			threeObject.updateWorldMatrix();
			var position = threeObject.localToWorld(new THREE.Vector3(0, 0, 0));
			threeObject.parent.remove(threeObject);
			threeObject.position.copy(position);
			threeObject.updateWorldMatrix();
			this.scene.add(threeObject);
		}
		let pos = threeObject.position;
		let quat = threeObject.quaternion;

		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
		var motionState = new Ammo.btDefaultMotionState( transform );

		var localInertia = new Ammo.btVector3( 0, 0, 0 );
		physicsShape.setMargin(this.margin);
		physicsShape.calculateLocalInertia(mass, localInertia );

		var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
		var body = new Ammo.btRigidBody( rbInfo );

		threeObject.userData.physicsBody = body;

		if (threeObject.userData.physics && threeObject.userData.physics.mass == 0)
			this.addUserPointer(body, threeObject);

		if ( mass > 0 ) {
			this.rigidBodies.push( threeObject );
			body.setActivationState(DISABLE_DEACTIVATION);
		}

		this.physicsWorld.addRigidBody(body);
		return body;
	}

	update(event) {
		var deltaTime = event.delta;

		// Step world
		this.physicsWorld.stepSimulation( deltaTime, STEP_SIMULATION);

		// Update rigid bodies
		for (let i = this.rigidBodies.length - 1; i >= 0; i-- ) {
			const objThree = this.rigidBodies[ i ];
			const objPhys = objThree.userData.physicsBody;

			if (objThree.position.y < - 25) {
				this.scene.remove(objThree);
				this.rigidBodies.splice(i, 1);
				this.physicsWorld.removeRigidBody(objPhys);
			} else {
				const ms = objPhys.getMotionState();
				if ( ms ) {
					ms.getWorldTransform(this.transformAux1 );
					const p = this.transformAux1.getOrigin();
					const q = this.transformAux1.getRotation();
					objThree.position.set( p.x(), p.y(), p.z() );
					objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
				}
			}
		}

		//console.log(this.dispatcher.getNumManifolds());

		if (this.bobCollided) return;

		//console.log('collision');

		for ( let i = 0, il = this.dispatcher.getNumManifolds(); i < il; i ++ ) {
			const contactManifold = this.dispatcher.getManifoldByIndexInternal( i );
			const rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody );
			const rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody );

			const threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
			const threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;

			if (!(threeObject0 && threeObject1)) {
				continue;
			}

			const userData0 = threeObject0 ? threeObject0.userData : null;
			const userData1 = threeObject1 ? threeObject1.userData : null;

			if (userData0.antbob || userData1.antbob) {
				this.bobCollided = true;
				//console.log('collision');
			}
			/*
			console.log(threeObject0);
			console.log(threeObject1);

			const breakable0 = userData0 ? userData0.breakable : false;
			const breakable1 = userData1 ? userData1.breakable : false;

			const collided0 = userData0 ? userData0.collided : false;
			const collided1 = userData1 ? userData1.collided : false;

			if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {
				continue;
			}

			let contact = false;
			let maxImpulse = 0;

			for ( let j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {
				const contactPoint = contactManifold.getContactPoint( j );
				if ( contactPoint.getDistance() < 0 ) {
					contact = true;
					const impulse = contactPoint.getAppliedImpulse();
					if ( impulse > maxImpulse ) {
						maxImpulse = impulse;
						const pos = contactPoint.get_m_positionWorldOnB();
						const normal = contactPoint.get_m_normalWorldOnB();
						impactPoint.set( pos.x(), pos.y(), pos.z() );
						impactNormal.set( normal.x(), normal.y(), normal.z() );
					}
					break;
				}
			}

			// If no point has contact, abort
			//if ( ! contact ) continue;
			console.log(contact);
			//console.log(threeObject0);
			//console.log(threeObject1);
			//*/
		}
	}



}
