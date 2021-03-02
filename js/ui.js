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
			'levels/' + level + '/app.json?v=8',
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

	disposePlayer() {
		if (this.player) {
			this.player.dispose();
			this.player = null;
			//this.container.innerHTML = '';
			this.container.style.display = 'none';
		}
	}

	showInteraction(data) {
		this.interactionName.innerHTML = data.name;
		this.interactHint.style.display = (data.interact && (data.interact.type != 'item')) ? 'block' : 'none';
		this.itemHint.style.display = (data.interact && data.interact.type == 'item') ? 'block' : 'none';
		this.interactionDialog.style.display = 'block';
	}

	hideInteraction() {
		this.interactionDialog.style.display = 'none';
	}

	showTalkDialog(data) {
		this.controls.disableMovement();
		if (this.player && this.player.playing) this.player.stop();
		this.hideInteraction();

		this.talkName.innerHTML = data.name;
		this.talkText.innerHTML = data.interact.text;

		if (data.interact.portrait) {
			this.talkPortrait.style.display = 'block';
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
		} else this.talkPortrait.style.display = 'none';

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
		this.talkDialog.style.display = 'none';
	}

	showActiveItem(name, text) {
		this.inventoryActiveItemName.innerHTML = name;
		this.inventoryActiveItemText.innerHTML = text;
		this.inventory.style.display = 'block';
	}

}
