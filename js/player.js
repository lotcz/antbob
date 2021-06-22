import ResourcesHelper from './resources.js';
import PhysicsHelper from './physics.js';
import StairsHelper from './stairs.js';
import UserdataHelper from './userdata.js';
import RootsHelper from './roots.js';
import PucellaHelper from './pucella/pucellas.js';
import SoundHelper from './sound.js';
import InteractionHelper from './interaction.js';
import AntBob from './antbob.js';

export default class Player {

	constructor(ui) {
		this.ui = ui;
		this.dom = this.ui.container;
		this.controls = ui.controls;
		this.story = ui.story;

		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.outputEncoding = THREE.sRGBEncoding;

		this.dom.appendChild(this.renderer.domElement);

		this.loader = new THREE.ObjectLoader();
		this.camera = null;
		this.scene = null;
		this.project = null;

		this.playing = false;
		this.onAnimate = null;

		this.events = {};
		this.antbob = null;
}

	async loadLevel(file) {
		const promise = new Promise(function(resolve, reject) {
			const loader = new THREE.FileLoader();
			loader.load(file, (text) => resolve(text), null, (err) => reject(err));
		});
		const text = await promise;
		const json = JSON.parse(text);

		this.project = json.project;

		if ( this.project.shadows !== undefined ) this.renderer.shadowMap.enabled = this.project.shadows;
		if ( this.project.shadowType !== undefined ) this.renderer.shadowMap.type = this.project.shadowType;
		if ( this.project.toneMapping !== undefined ) this.renderer.toneMapping = this.project.toneMapping;
		if ( this.project.toneMappingExposure !== undefined ) this.renderer.toneMappingExposure = this.project.toneMappingExposure;
		if ( this.project.physicallyCorrectLights !== undefined ) this.renderer.physicallyCorrectLights = this.project.physicallyCorrectLights;

		this.setScene(this.loader.parse(json.scene));
		if (this.scene.userData && this.scene.userData.camera) {
			this.setCamera(this.scene.getObjectByName(this.scene.userData.camera.name));
		}

		if (this.camera == null) {
			this.setCamera(this.loader.parse(json.camera));
		}

		this.events = {
			init: [],
			start: [],
			stop: [],
			keydown: [],
			keyup: [],
			pointerdown: [],
			pointerup: [],
			pointermove: [],
			update: []
		};

		var scriptWrapParams = 'player,renderer,scene,camera';
		var scriptWrapResultObj = {};

		for (var eventKey in this.events) {
			scriptWrapParams += ',' + eventKey;
			scriptWrapResultObj[ eventKey ] = eventKey;
		}

		var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

		for (let uuid in json.scripts) {
			const object = this.scene.getObjectByProperty( 'uuid', uuid, true );
			if ( object === undefined ) {
				console.warn( 'APP.Player: Script without object.', uuid );
				continue;
			}

			var scripts = json.scripts[ uuid ];
			for ( var i = 0; i < scripts.length; i ++ ) {
				var script = scripts[ i ];
				var functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( this, this.renderer, this.scene, this.camera );
				for ( var name in functions ) {
					if ( functions[ name ] === undefined ) continue;
					if ( this.events[ name ] === undefined ) {
						console.warn( 'APP.Player: Event type not supported (', name, ')' );
						continue;
					}
					this.events[name].push( functions[ name ].bind( object ) );
				}
			}
		}
		this.dispatch(this.events.init, arguments);

		//
		// MY STUFF
		//

		const tasks = [];

		this.userdata = new UserdataHelper(this.scene);

		this.resources = new ResourcesHelper(this);
		await this.resources.processUserData(this.userdata.userData.load);

		const stairs = new StairsHelper(this);

		const roots = new RootsHelper(this);

		this.physics = new PhysicsHelper(this);
		this.events.update.push((e) => this.physics.update(e));

		this.antbob = new AntBob(this);
		this.events.update.push((e) => this.antbob.update(e));
		tasks.push(this.antbob.load());

		this.pucellas = new PucellaHelper(this);
		this.events.update.push((e) => this.pucellas.update(e));
		tasks.push(this.pucellas.load());

		this.interaction = new InteractionHelper(this, this.controls, this.antbob, this.ui);
		this.events.update.push((e) => this.interaction.update(e));

		await Promise.all(tasks);

		//this.sound = new SoundHelper('sound/forest_1.mp3');
		//this.sound.play();

		this.onResize = () => this.setSize(this.dom.offsetWidth, this.dom.offsetHeight);
		this.onResize();
		window.addEventListener('resize', this.onResize);
	}

	setCamera(value) {
		this.camera = value;
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}

	setScene(value) {
		this.scene = value;
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		if (this.camera) {
			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();
		}

		if (this.renderer) {
			this.renderer.setSize( width, height );
		}
	}

	dispatch( array, event ) {
		for ( var i = 0, l = array.length; i < l; i ++ ) {
			array[ i ]( event );
		}
	}

	animate() {
		if (!this.playing) return;

		const time = performance.now();

		// EVENTS
		try {
			this.dispatch( this.events.update, { time: time, delta: time - this.prevTime } );
		} catch ( e ) {
			console.error( ( e.message || e ), ( e.stack || '' ) );
		}

		// CAMERA
		if (!this.camera) return;
		if (this.camera.userData) {
			if (this.camera.userData.type == 'follow') {
				var pos = this.camera.userData.position;
				this.camera.position.set(this.antbob.group.position.x + pos.x, this.antbob.group.position.y + pos.y, this.antbob.group.position.z + pos.z);
			}
			this.camera.lookAt(this.antbob.group.position);
		}

		// RENDER
		if (!this.renderer) return;
		this.renderer.render(this.scene, this.camera);
		this.prevTime = time;

		requestAnimationFrame(this.onAnimate);
	}

	play() {
		this.dispatch(this.events.start, arguments);
		if (this.onAnimate === null) {
			this.onAnimate = () => this.animate();
		}
		this.playing = true;
		this.prevTime = performance.now();
		this.animate();
	}

	stop() {
		this.playing = false;
		this.dispatch(this.events.stop, arguments);
	}

	dispose() {
		this.stop();
		this.renderer.setAnimationLoop(null);
		this.renderer.forceContextLoss();
		this.renderer.dispose();
		this.renderer = undefined;
		this.camera = undefined;
		this.scene = undefined;
		window.removeEventListener('resize', this.onResize);
	}

}
