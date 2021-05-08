import Player from './player.js';
import Controls from './controls.js';

export default class UI {

	constructor(level) {
		this.controls = new Controls();
		this.dom = document.getElementById('ui');
		this.container = document.getElementById('container');
		this.interactionDialog = document.getElementById('interaction_dialog');
		this.interactionName = document.getElementById('interaction_name');
		this.interactHint = document.getElementById('interact_hint');
		this.itemHint = document.getElementById('item_hint');
		this.exitHint = document.getElementById('exit_hint');
		this.talkHint = document.getElementById('talk_hint');
		this.talkDialog = document.getElementById('talk_dialog');
		this.talkPortrait = document.getElementById('talk_portrait');
		this.talkName = document.getElementById('talk_name');
		this.talkText = document.getElementById('talk_text');
		this.continueHint = document.getElementById('continue_hint');
		this.inventory = document.getElementById('inventory');
		this.inventoryActiveItemName = document.getElementById('active_item_name');
		this.inventoryActiveItemText = document.getElementById('active_item_text');
		this.inventoryActiveItemPortrait = document.getElementById('active_item_portrait');
		this.player = new Player(this.container, this);

		this.showInteraction({ name: 'Loading...'});
		this.player.loadFile(
			'levels/' + level + '/app.json?v=15',
			() =>  {
				//this.player.setCamera(this.player.scene.getObjectByName('PerspectiveCamera'));
				this.player.play();
				this.container.style.display = 'block';
			}
		);
	}

	loadLevel(name) {
		window.location = '?level=' + name;
		this.disposePlayer();
	}

	showInteraction(data) {
		this.interactionName.innerHTML = data.name;
		this.hideElement(this.interactHint);
		this.hideElement(this.itemHint);
		this.hideElement(this.exitHint);
		this.hideElement(this.talkHint);

		if (data.interact) {
			switch (data.interact.type) {
				case 'item':
					this.showElement(this.itemHint);
					break;
				case 'talk':
					this.showElement(this.talkHint);
					break;
				case 'exit':
					this.showElement(this.exitHint);
					break;
				default:
					this.showElement(this.interactHint);
			}
		}

		this.showElement(this.interactionDialog);
	}

	hideInteraction() {
		this.hideElement(this.interactionDialog);
	}

	showTalkDialog(data) {
		this.controls.disableMovement();
		if (this.player && this.player.playing) this.player.stop();
		this.hideInteraction();

		this.talkName.innerHTML = data.name;
		this.talkText.innerHTML = data.interact.text;

		if (data.interact.portrait) {
			this.showElement(this.talkPortrait);
			var portrait = this.player.scene.getObjectByName(data.interact.portrait);
			if (portrait) {
				var width = 100;
				var height = 100;

				if (!this.camera) {
					this.camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 10);
					this.camera.updateProjectionMatrix();
				}

				if (!this.renderer) {
					this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
					this.renderer.setPixelRatio( window.devicePixelRatio );
					this.renderer.outputEncoding = THREE.sRGBEncoding;
					this.talkPortrait.appendChild(this.renderer.domElement);
					this.renderer.setSize( width, height );
				}

				var camPosition = portrait.localToWorld(new THREE.Vector3(0, 0, 0));
				camPosition.x += 0.8;
				camPosition.y += 0.5;
				camPosition.z += 0.8;
				this.camera.position.copy(camPosition);
				this.camera.lookAt(portrait.position);
				this.player.antbob.group.visible = false;
				this.renderer.render(this.player.scene, this.camera);
				this.player.antbob.group.visible = true;
			}
		} else this.hideElement(this.talkPortrait);

		// show
		this.talkDialog.style.display = 'flex';
		this.onAnyKey = () => this.hideTalkDialog();
		window.addEventListener( 'keydown', this.onAnyKey, false );
	}

	hideTalkDialog() {
		if (this.onAnyKey) {
			window.removeEventListener( 'keydown', this.onAnyKey, false );
			this.onAnyKey = null;
		}
		if (this.player && !this.player.playing) this.player.play();
		this.controls.enableMovement();
		this.hideElement(this.talkDialog);
	}

	showActiveItem(name, text) {
		this.inventoryActiveItemName.innerHTML = name;
		this.inventoryActiveItemText.innerHTML = text;
		this.showElement(this.inventory);
	}

	showElement(element) {
		element.style.display = 'block';
	}

	hideElement(element) {
		element.style.display = 'none';
	}

	disposePlayer() {
		if (this.player) {
			this.player.dispose();
			this.player = null;
			this.container.style.display = 'none';
		}
	}

}
