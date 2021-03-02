import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

export default class AnimationHelper {

	constructor(player, path, onloaded) {
		this.player = player;
		this.onloaded = onloaded;
		this.model = null;
		const loader = new GLTFLoader();
		loader.load(path, (gltf) => this.onModelLoaded(gltf));
	}

	onModelLoaded(gltf) {
		this.model = gltf.scene;
		this.player.scene.add(this.model);

		this.model.traverse( function ( object ) {
			if ( object.isMesh ) {
				object.castShadow = true;
				object.receiveShadow = true;
			 }
		});

		const animations = gltf.animations;
		this.mixer = new THREE.AnimationMixer(this.model);

		let clip = animations && animations.length > 0 ? animations[0] : null;
		if (clip) {
			const action = this.mixer.clipAction(clip);
			action.play();
		}
		this.modifyTimeScale(0.001);

		if (this.onloaded)
			this.onloaded(this.model);
	}

	update(event) {
		var deltaTime = event.delta;
		this.mixer.update(deltaTime);
	}

	modifyTimeScale(speed) {
		this.mixer.timeScale = speed;
	}

	playBackwards() {
		this.mixer.timeScale = -Math.abs(this.mixer.timeScale);
	}

	playForward() {
		this.mixer.timeScale = Math.abs(this.mixer.timeScale);
	}

}
