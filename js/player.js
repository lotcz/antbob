import PhysicsHelper from './physics.js';
import UserdataHelper from './userdata.js';
import AnimationHelper from './animation.js';
import SoundHelper from './sound.js';
import InteractionHelper from './interaction.js';
import Controls from './controls.js';
import AntBob from './antbob.js';

export default class Player {

	constructor(dom, ui) {
		this.dom = dom;
		this.ui = ui;
		this.controls = ui.controls;

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

	loadFile(file, onLoaded) {
		var loader = new THREE.FileLoader();
		var _this = this;
		loader.load(file, function ( text ) {
			_this.load(
				JSON.parse(text),
				onLoaded
			 );
		});
	}

	load(json, onBobLoaded) {
		this.project = json.project;

		if ( this.project.shadows !== undefined ) this.renderer.shadowMap.enabled = this.project.shadows;
		if ( this.project.shadowType !== undefined ) this.renderer.shadowMap.type = this.project.shadowType;
		if ( this.project.toneMapping !== undefined ) this.renderer.toneMapping = this.project.toneMapping;
		if ( this.project.toneMappingExposure !== undefined ) this.renderer.toneMappingExposure = this.project.toneMappingExposure;
		if ( this.project.physicallyCorrectLights !== undefined ) this.renderer.physicallyCorrectLights = this.project.physicallyCorrectLights;

		this.setScene(this.loader.parse(json.scene));
		this.setCamera(this.loader.parse(json.camera));

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

		for ( var uuid in json.scripts ) {
			var object = this.scene.getObjectByProperty( 'uuid', uuid, true );
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

		// MY STUFF
		this.userdata = new UserdataHelper(this.scene);

		// PHYSICS
		var physics = this.physics = new PhysicsHelper(this);
		this.events.update.push((e) => physics.update(e));

		// BOB
		var bob = this.antbob = new AntBob(this, this.physics, this.controls, onBobLoaded);
		this.events.update.push((e) => bob.update(e));

		var interaction = this.interaction = new InteractionHelper(this, this.controls, this.antbob, this.ui);
		this.events.update.push((e) => interaction.update(e));

		// SOUND
		this.sound = new SoundHelper('sound/forest_1.mp3');
		this.sound.play();

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
		if (!this.renderer) return;

		var time = performance.now();

		try {
			this.dispatch( this.events.update, { time: time, delta: time - this.prevTime } );
		} catch ( e ) {
			console.error( ( e.message || e ), ( e.stack || '' ) );
		}

		this.renderer.render(this.scene, this.camera);
		this.prevTime = time;
	}

	play() {
		this.prevTime = performance.now();
		this.dispatch(this.events.start, arguments);
		if (this.onAnimate === null) {
			this.onAnimate = () => this.animate();
			this.renderer.setAnimationLoop(this.onAnimate);
		}
		//this.renderer.setAnimationLoop(this.onAnimate);
		this.playing = true;
	}

	stop() {
		//this.renderer.setAnimationLoop(null);
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
