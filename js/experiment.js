export default class MyExperiment {

	constructor(player) {
		this.physics = player.physics;
		const physicsWorld = this.physics.physicsWorld;

		this.armMovement = 0;

		const scene = this.scene = new THREE.Group();
		player.scene.add(scene);
		scene.position.set(0, 0, 0);
		//scene.scale.set(0.5, 0.5, 0.5);

		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();

		var textureLoader = new THREE.TextureLoader();

		// Wall
		const brickMass = 0.5;
		const brickLength = 1.2;
		const brickDepth = 0.6;
		const brickHeight = brickLength * 0.5;
		const numBricksLength = 6;
		const numBricksHeight = 8;
		const z0 = - numBricksLength * brickLength * 0.5;
		pos.set( 0, brickHeight * 0.5, z0 );
		quat.set( 0, 0, 0, 1 );

		for ( let j = 0; j < numBricksHeight; j ++ ) {
			const oddRow = ( j % 2 ) == 1;
			pos.z = z0;
			if ( oddRow ) {
				pos.z -= 0.25 * brickLength;
			}

			const nRow = oddRow ? numBricksLength + 1 : numBricksLength;
			for ( let i = 0; i < nRow; i ++ ) {
				let brickLengthCurrent = brickLength;
				let brickMassCurrent = brickMass;

				if ( oddRow && ( i == 0 || i == nRow - 1 ) ) {
					brickLengthCurrent *= 0.5;
					brickMassCurrent *= 0.5;
				}

				const brick = this.createParalellepiped( brickDepth, brickHeight, brickLengthCurrent, brickMassCurrent, pos, quat, this.createMaterial() );
				brick.castShadow = true;
				brick.receiveShadow = true;

				if ( oddRow && ( i == 0 || i == nRow - 2 ) ) {
					pos.z += 0.75 * brickLength;
				} else {
					pos.z += brickLength;
				}
			}
			pos.y += brickHeight;
		}

		// The cloth
		// Cloth graphic object
		const clothWidth = 4;
		const clothHeight = 3;
		const clothNumSegmentsZ = clothWidth * 5;
		const clothNumSegmentsY = clothHeight * 5;
		const clothPos = new THREE.Vector3( - 3, 3, 2 );

		const clothGeometry = new THREE.PlaneGeometry( clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY );
		clothGeometry.rotateY( Math.PI * 0.5 );
		clothGeometry.translate( clothPos.x, clothPos.y + clothHeight * 0.5, clothPos.z - clothWidth * 0.5 );

		const clothMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, side: THREE.DoubleSide } );
		const cloth = this.cloth = new THREE.Mesh( clothGeometry, clothMaterial );
		this.cloth.castShadow = true;
		this.cloth.receiveShadow = true;
		scene.add( this.cloth );
		textureLoader.load( "textures/grid.png",  function ( texture ) {
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set( clothNumSegmentsZ, clothNumSegmentsY );
			cloth.material.map = texture;
			cloth.material.needsUpdate = true;
		} );

		// Cloth physic object
		const softBodyHelpers = new Ammo.btSoftBodyHelpers();
		const clothCorner00 = new Ammo.btVector3( clothPos.x, clothPos.y + clothHeight, clothPos.z );
		const clothCorner01 = new Ammo.btVector3( clothPos.x, clothPos.y + clothHeight, clothPos.z - clothWidth );
		const clothCorner10 = new Ammo.btVector3( clothPos.x, clothPos.y, clothPos.z );
		const clothCorner11 = new Ammo.btVector3( clothPos.x, clothPos.y, clothPos.z - clothWidth );
		const clothSoftBody = softBodyHelpers.CreatePatch( physicsWorld.getWorldInfo(), clothCorner00, clothCorner01, clothCorner10, clothCorner11, clothNumSegmentsZ + 1, clothNumSegmentsY + 1, 0, true );
		const sbConfig = clothSoftBody.get_m_cfg();
		sbConfig.set_viterations( 10 );
		sbConfig.set_piterations( 10 );

		clothSoftBody.setTotalMass( 0.9, false );
		var margin = this.physics.margin;
		Ammo.castObject( clothSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
		physicsWorld.addSoftBody( clothSoftBody, 1, - 1 );
		this.cloth.userData.physicsBody = clothSoftBody;
		// Disable deactivation
		clothSoftBody.setActivationState( 4 );

		// The base
		const armMass = 2;
		const armLength = 3 + clothWidth;
		const pylonHeight = clothPos.y + clothHeight;
		const baseMaterial = new THREE.MeshPhongMaterial( { color: 0x606060 } );
		pos.set( clothPos.x, 0.1, clothPos.z - armLength );
		quat.set( 0, 0, 0, 1 );
		const base = this.createParalellepiped( 1, 0.2, 1, 0, pos, quat, baseMaterial );
		base.castShadow = true;
		base.receiveShadow = true;
		pos.set( clothPos.x, 0.5 * pylonHeight, clothPos.z - armLength );
		const pylon = this.createParalellepiped( 0.4, pylonHeight, 0.4, 0, pos, quat, baseMaterial );
		pylon.castShadow = true;
		pylon.receiveShadow = true;
		pos.set( clothPos.x, pylonHeight + 0.2, clothPos.z - 0.5 * armLength );
		const arm = this.createParalellepiped( 0.4, 0.4, armLength + 0.4, armMass, pos, quat, baseMaterial );
		arm.castShadow = true;
		arm.receiveShadow = true;

		// Glue the cloth to the arm
		const influence = 0.5;
		clothSoftBody.appendAnchor( 0, arm.userData.physicsBody, false, influence );
		clothSoftBody.appendAnchor( clothNumSegmentsZ, arm.userData.physicsBody, false, influence );

		// Hinge constraint to move the arm
		const pivotA = new Ammo.btVector3( 0, pylonHeight * 0.5, 0 );
		const pivotB = new Ammo.btVector3( 0, - 0.2, - armLength * 0.5 );
		const axis = new Ammo.btVector3( 0, 1, 0 );
		this.hinge = new Ammo.btHingeConstraint( pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true );
		physicsWorld.addConstraint( this.hinge, true );
	}

	updatePhysics(event) {
		var deltaTime = event.delta;

		// Hinge control
		this.hinge.enableAngularMotor( true, 0.8 * this.armMovement, 50 );

		// Update cloth
		const softBody = this.cloth.userData.physicsBody;
		const clothPositions = this.cloth.geometry.attributes.position.array;
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

		this.cloth.geometry.computeVertexNormals();
		this.cloth.geometry.attributes.position.needsUpdate = true;
		this.cloth.geometry.attributes.normal.needsUpdate = true;
	}

	createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
		var threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
		threeObject.position.set(pos.x, pos.y, pos.z);
		threeObject.quaternion.set(quat.x, quat.y, quat.z, quat.w);
		this.scene.add(threeObject);
		this.physics.createRigidBodyFromBox(threeObject, mass);
		return threeObject;
	}

	createRandomColor() {
		return Math.floor( Math.random() * ( 1 << 24 ) );
	}

	createMaterial() {
		return new THREE.MeshPhongMaterial( { color: this.createRandomColor() } );
	}

}
