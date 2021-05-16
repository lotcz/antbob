import { BufferGeometryUtils } from '../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

const DISABLE_DEACTIVATION = 4;
const STEP_SIMULATION = 1;
const PHYSICS_SPEED = 0.01;
const DEFAULT_GRAVITY = -9.8;
const DEFAULT_MARGIN = 0.01;

const DEFAULT_FRICTION = 1;
const DEFAULT_ROLLING_FRICTION = 0.05;
const DEFAULT_RESTITUTION = 0.1;
const DEFAULT_LINEAR_DAMPING = 0.1;
const DEFAULT_ANGULAR_DAMPING = 0.1;
const DEFAULT_PRESSURE = 7;
const DEFAULT_STIFFNESS = 0.9;

export default class PhysicsHelper {

	constructor(player, gravity, margin) {
		this.player = player;
		this.scene = player.scene;

		const broadphase = new Ammo.btDbvtBroadphase();
		const solver = new Ammo.btSequentialImpulseConstraintSolver();

		if (true) {
			const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
			this.dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration );
			const softBodySolver = new Ammo.btDefaultSoftBodySolver();
			this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(this.dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
			this.softBodyHelpers = new Ammo.btSoftBodyHelpers();
		} else {
			const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
			this.dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
			this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, broadphase, solver, collisionConfiguration);
			//physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3( 0, gravityConstant, 0));
		}

		if (gravity === undefined) gravity = new Ammo.btVector3(0, DEFAULT_GRAVITY, 0);
		this.physicsWorld.setGravity(gravity);
		this.physicsWorld.getWorldInfo().set_m_gravity(gravity);

		this.transformAux1 = new Ammo.btTransform();

		this.allBodies = [];
		this.rigidBodies = [];
		this.clothBodies = [];
		this.softBodies = [];

		if (margin === undefined) margin = DEFAULT_MARGIN;
		this.margin = margin;

		// this disables collision detection for now
		this.bobCollided = true;

		if (player.userdata) this.processUserData(player.userdata);
	}

	processUDataNode(udata) {
		if (udata.data.type === 'rigidBox')
			this.createRigidBodyFromBox(udata.node, udata.data);
		if (udata.data.type === 'rigidSphere')
			this.createRigidBodyFromSphere(udata.node, udata.data);
		if (udata.data.type === 'rigidOctahedron')
			this.createRigidBodyFromOctahedron(udata.node, udata.data);
		if (udata.data.type === 'rigidCylinder')
			this.createRigidBodyFromCylinder(udata.node, udata.data);
		if (udata.data.type === 'cloth')
			this.createCloth(udata.node, udata.data);
		if (udata.data.type === 'softBody')
			this.createSoftVolume(udata.node, udata.data);
	}

	processUserData(userdata) {
		for (var i = 0; i < userdata.userData.physics.length; i++) {
			this.processUDataNode(userdata.userData.physics[i]);
		}
	}

	processMesh(mesh) {
		if (!mesh) return;
		if (mesh.userData && mesh.userData.physics)
			this.processUDataNode({node: mesh, data: mesh.userData.physics});
		else {
			for (let i = 0, max = mesh.children.length; i < max; i++) {
				this.processMesh(mesh.children[i]);
			}
		}
	}

	createRigidBodyFromBox(threeObject, data) {
		var shape = new Ammo.btBoxShape(
			new Ammo.btVector3(
				threeObject.geometry.parameters.width * 0.5,
				threeObject.geometry.parameters.height * 0.5,
				threeObject.geometry.parameters.depth * 0.5
			)
		);
		var body = this.createRigidBody(threeObject, shape, data);
		return body;
	}

	createRigidBodyFromSphere(threeObject, data) {
		var shape = new Ammo.btSphereShape(threeObject.geometry.parameters.radius);
		return this.createRigidBody(threeObject, shape, data);
	}

	createRigidBodyFromCylinder(threeObject, data) {
		let radiusTop = threeObject.geometry.parameters.radiusTop;
		let radiusBottom = threeObject.geometry.parameters.radiusBottom;
		let height = threeObject.geometry.parameters.height;
		var radius = (radiusTop + radiusBottom) / 2;
		var shape = new Ammo.btCylinderShape(new Ammo.btVector3(radius, height * 0.5, radius));
		return this.createRigidBody(threeObject, shape, data);
	}

	createRigidBodyFromOctahedron(threeObject, data) {
		var shape = new Ammo.btSphereShape(threeObject.geometry.parameters.radius);
		return this.createRigidBody(threeObject, shape, data);
	}

	// Set pointer back to the three object
	addUserPointer(body, threeObject) {
		const btVecUserData = new Ammo.btVector3(0, 0, 0);
		btVecUserData.threeObject = threeObject;
		body.setUserPointer( btVecUserData );
	}

	getWorldVisibility(threeObject) {
		if (threeObject == null) return true;
		if (!threeObject.visible) return false;
		return this.getWorldVisibility(threeObject.parent);
	}

	moveToScene(threeObject) {
		if (threeObject.parent && threeObject.parent !== this.scene) {
			threeObject.visible = this.getWorldVisibility(threeObject);
			var pos = new THREE.Vector3();
			threeObject.getWorldPosition(pos);
			var quat = new THREE.Quaternion();
			threeObject.getWorldQuaternion(quat);
			var scale = new THREE.Vector3();
			threeObject.getWorldScale(scale);

			threeObject.parent.remove(threeObject);

			threeObject.position.copy(pos);
			threeObject.quaternion.copy(quat);
			threeObject.scale.copy(scale);
			this.scene.add(threeObject);
		}
	}

	createRigidBody(threeObject, physicsShape, data) {
		data = data || [];
		this.moveToScene(threeObject);
		var position = threeObject.position;
		var quaternion = threeObject.quaternion;

		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
		transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
		var motionState = new Ammo.btDefaultMotionState(transform);

		var localInertia = new Ammo.btVector3(0, 0, 0);
		physicsShape.setMargin(this.margin);
		physicsShape.calculateLocalInertia(data.mass, localInertia );

		var rbInfo = new Ammo.btRigidBodyConstructionInfo(data.mass, motionState, physicsShape, localInertia);
		var body = new Ammo.btRigidBody( rbInfo );

		var collision = body.getCollisionShape();
		collision.setLocalScaling(new Ammo.btVector3(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z));

		threeObject.userData.physicsBody = body;

		if (threeObject.userData.physics && data.mass == 0)
			this.addUserPointer(body, threeObject);

		this.allBodies.push(threeObject);

		if (data.mass > 0) {
			this.rigidBodies.push(threeObject);
			body.setActivationState(DISABLE_DEACTIVATION);
		}

		// PHYSICAL PARAMETERS
		body.setRestitution(data.restitution || DEFAULT_RESTITUTION);
		body.setFriction(data.friction || DEFAULT_FRICTION);
		body.setRollingFriction(data.rollingFriction || DEFAULT_ROLLING_FRICTION);
		body.setDamping(data.linearDamping || DEFAULT_LINEAR_DAMPING, data.angularDamping || DEFAULT_ANGULAR_DAMPING);

		this.physicsWorld.addRigidBody(body);
		return body;
	}

	isEqual(x1, y1, z1, x2, y2, z2) {
		const delta = 0.000001;
		return Math.abs( x2 - x1 ) < delta &&
			Math.abs( y2 - y1 ) < delta &&
			Math.abs( z2 - z1 ) < delta;
	}

	mapIndices( bufGeometry, indexedBufferGeom ) {
		// Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry
		const vertices = bufGeometry.attributes.position.array;
		const idxVertices = indexedBufferGeom.attributes.position.array;
		const indices = indexedBufferGeom.index.array;
		const numIdxVertices = idxVertices.length / 3;
		const numVertices = vertices.length / 3;
		bufGeometry.ammoVertices = idxVertices;
		bufGeometry.ammoIndices = indices;
		bufGeometry.ammoIndexAssociation = [];
		for ( let i = 0; i < numIdxVertices; i ++ ) {
			const association = [];
			bufGeometry.ammoIndexAssociation.push( association );
			const i3 = i * 3;
			for ( let j = 0; j < numVertices; j ++ ) {
				const j3 = j * 3;
				if (this.isEqual( idxVertices[ i3 ], idxVertices[ i3 + 1 ], idxVertices[ i3 + 2 ],
					vertices[ j3 ], vertices[ j3 + 1 ], vertices[ j3 + 2 ] ) ) {
					association.push( j3 );
				}
			}
		}
	}

	processGeometry( bufGeometry ) {
		// Ony consider the position values when merging the vertices
		const posOnlyBufGeometry = new THREE.BufferGeometry();
		posOnlyBufGeometry.setAttribute('position', bufGeometry.getAttribute('position'));
		posOnlyBufGeometry.setIndex(bufGeometry.getIndex());
		// Merge the vertices so the triangle soup is converted to indexed triangles
		const indexedBufferGeom = BufferGeometryUtils.mergeVertices(posOnlyBufGeometry);
		// Create index arrays mapping the indexed vertices to bufGeometry vertices
		this.mapIndices( bufGeometry, indexedBufferGeom );
	}

	createSoftVolume(threeObject, data) {
		var material =  threeObject.material.clone();
		var position = new THREE.Vector3();
		threeObject.getWorldPosition(position);
		var quaternion = new THREE.Quaternion();
		threeObject.getWorldQuaternion(quaternion);

		threeObject.parent.remove(threeObject);

		var bufferGeom = threeObject.geometry.clone();
		bufferGeom.translate(position.x, position.y, position.z);
		bufferGeom.rotateX(quaternion.x);
		bufferGeom.rotateY(quaternion.y);
		bufferGeom.rotateZ(quaternion.z);
		this.processGeometry(bufferGeom);

		threeObject = new THREE.Mesh(bufferGeom, material);
		//threeObject.position.set(position.x, position.y, position.z);
		//threeObject.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
		threeObject.castShadow = true;
		threeObject.receiveShadow = true;
		threeObject.frustumCulled = false;
		this.scene.add( threeObject );

		// Volume physic object
		const volumeSoftBody = this.softBodyHelpers.CreateFromTriMesh(
			this.physicsWorld.getWorldInfo(),
			bufferGeom.ammoVertices,
			bufferGeom.ammoIndices,
			bufferGeom.ammoIndices.length / 3,
			true
		);

		const sbConfig = volumeSoftBody.get_m_cfg();
		sbConfig.set_viterations(40);
		sbConfig.set_piterations(40);
		// Soft-soft and soft-rigid collisions
		sbConfig.set_collisions(0x11);
		// Friction
		sbConfig.set_kDF(data.friction || DEFAULT_FRICTION);
		// Damping
		sbConfig.set_kDP(data.linearDamping || DEFAULT_LINEAR_DAMPING);
		// Pressure
		sbConfig.set_kPR(data.pressure || DEFAULT_PRESSURE);
		// Stiffness
		volumeSoftBody.get_m_materials().at(0).set_m_kLST(data.stiffness || DEFAULT_STIFFNESS);
		volumeSoftBody.get_m_materials().at(0).set_m_kAST(data.stiffness || DEFAULT_STIFFNESS);
		volumeSoftBody.setTotalMass(data.mass, false);
		Ammo.castObject( volumeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin(this.margin);
		this.physicsWorld.addSoftBody(volumeSoftBody, 1, - 1);
		threeObject.userData.physicsBody = volumeSoftBody;
		volumeSoftBody.setActivationState(DISABLE_DEACTIVATION);

		this.softBodies.push(threeObject);
		this.allBodies.push(threeObject);
	}

	createCloth(threeObject, data) {
		data = data || [];

		const clothWidth = threeObject.geometry.parameters.width;
		const clothHeight = threeObject.geometry.parameters.height;
		const material = threeObject.material;
		const clothNumSegmentsZ = clothWidth * 5;
		const clothNumSegmentsY = clothHeight * 5;
		const clothPos = new THREE.Vector3();
		threeObject.getWorldPosition(clothPos);
		//clothPos.add(new THREE.Vector3(0, - clothHeight/2, clothHeight/2));
		const quaternion = new THREE.Quaternion();
		threeObject.getWorldQuaternion(quaternion);
		const clothCornerTopLeft = new Ammo.btVector3(-clothWidth/2, clothHeight/2, 0);
		const clothCornerTopRight = new Ammo.btVector3(clothWidth/2, clothHeight/2, 0);
		const clothCornerBottomLeft = new Ammo.btVector3(-clothWidth/2, -clothHeight/2, 0);
		const clothCornerBottomRight = new Ammo.btVector3(clothWidth/2, -clothHeight/2, 0);

		const clothSoftBody = this.softBodyHelpers.CreatePatch(this.physicsWorld.getWorldInfo(), clothCornerTopRight, clothCornerTopLeft, clothCornerBottomRight, clothCornerBottomLeft, clothNumSegmentsZ + 1, clothNumSegmentsY + 1, 0, true);
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(clothPos.x, clothPos.y, clothPos.z));
		transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
		clothSoftBody.transform(transform);

		const sbConfig = clothSoftBody.get_m_cfg();
		sbConfig.set_viterations(40);
		sbConfig.set_piterations(40);

		clothSoftBody.setTotalMass(data.mass, false );
		Ammo.castObject( clothSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin(this.margin * 3 );
		this.physicsWorld.addSoftBody(clothSoftBody, 1, - 1 );
		clothSoftBody.setActivationState(DISABLE_DEACTIVATION);

		// anchors
		const influence = 0.5;
		var anchors = data.anchors || [];
		for (var i = 0; i < anchors.length; i++) {
			var a = this.scene.getObjectByName(anchors[i].name);
			//this.moveToScene(a);
			//console.log(a);
			clothSoftBody.appendAnchor( 0, a.userData.physicsBody, false, influence );
			clothSoftBody.appendAnchor( clothNumSegmentsZ, a.userData.physicsBody, false, influence );
		}

		threeObject.parent.remove(threeObject);

		const clothGeometry = new THREE.PlaneGeometry(clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY);
		clothGeometry.translate(clothPos.x, clothPos.y, clothPos.z);
		clothGeometry.rotateX(quaternion.x);
		clothGeometry.rotateY(quaternion.y);
		clothGeometry.rotateZ(quaternion.z);
		var cloth = new THREE.Mesh(clothGeometry, material);
		//cloth.castShadow = true;
		//cloth.receiveShadow = true;
		cloth.userData.physicsBody = clothSoftBody;
		this.clothBodies.push(cloth);

		this.scene.add(cloth);
	}

	update(event) {
		var deltaTime = event.delta;

		// Step world
		this.physicsWorld.stepSimulation(deltaTime * PHYSICS_SPEED, STEP_SIMULATION);

		// Update cloth
		for (let i = this.clothBodies.length - 1; i >= 0; i-- ) {
			const softBody = this.clothBodies[i].userData.physicsBody;
			const geometry = this.clothBodies[i].geometry;
			const clothPositions = geometry.attributes.position.array;
			const numVerts = clothPositions.length / 3;
			const nodes = softBody.get_m_nodes();
			let indexFloat = 0;

			for ( let i = 0; i < numVerts; i ++ ) {
				const node = nodes.at( i );
				const nodePos = node.get_m_x();
				clothPositions[ indexFloat ++ ] = nodePos.x();
				clothPositions[ indexFloat ++ ] = nodePos.y();
				clothPositions[ indexFloat ++ ] = nodePos.z();
			}

			geometry.computeVertexNormals();
			geometry.attributes.position.needsUpdate = true;
			geometry.attributes.normal.needsUpdate = true;
		}

		// Update soft volumes
		for ( let i = 0, il = this.softBodies.length; i < il; i ++ ) {
			const volume = this.softBodies[i];
			const geometry = volume.geometry;
			const softBody = volume.userData.physicsBody;
			const volumePositions = geometry.attributes.position.array;
			const volumeNormals = geometry.attributes.normal.array;
			const association = geometry.ammoIndexAssociation;
			const numVerts = association.length;
			const nodes = softBody.get_m_nodes();
			for ( let j = 0; j < numVerts; j ++ ) {

				const node = nodes.at( j );
				const nodePos = node.get_m_x();
				const x = nodePos.x();
				const y = nodePos.y();
				const z = nodePos.z();
				const nodeNormal = node.get_m_n();
				const nx = nodeNormal.x();
				const ny = nodeNormal.y();
				const nz = nodeNormal.z();

				const assocVertex = association[ j ];

				for ( let k = 0, kl = assocVertex.length; k < kl; k ++ ) {

					let indexVertex = assocVertex[ k ];
					volumePositions[ indexVertex ] = x;
					volumeNormals[ indexVertex ] = nx;
					indexVertex ++;
					volumePositions[ indexVertex ] = y;
					volumeNormals[ indexVertex ] = ny;
					indexVertex ++;
					volumePositions[ indexVertex ] = z;
					volumeNormals[ indexVertex ] = nz;

				}

			}

			geometry.attributes.position.needsUpdate = true;
			geometry.attributes.normal.needsUpdate = true;
			geometry.needsUpdate = true;
		}

		// Update rigid bodies
		for (let i = this.rigidBodies.length - 1; i >= 0; i-- ) {
			const objThree = this.rigidBodies[ i ];
			const objPhys = objThree.userData.physicsBody;

			if (objThree.position.y < - 25) {
				// !!! REMOVE OBJECT OFF THE SCREEN !!!
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
