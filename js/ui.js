import * as THREE from '../node_modules/three/build/three.module.js';
window.THREE = THREE; // Used by APP Scripts.

import Player from './player.js';
import Controls from './controls.js';
import StoryHelper from './story.js';

export default class UI {

	constructor() {
		this.dom = document.getElementById('ui');
		this.container = document.getElementById('container');

		this.inventorySlots = [];
		this.inventory = this.addElement(this.dom, 'inventory fixed hidden');
		const headContainer = this.addElement(this.inventory, 'row');
		this.inventorySlots['head'] = this.addElement(headContainer, 'inventory-slot dialog hidden');
		const handsContainer = this.addElement(this.inventory, 'row');
		this.inventorySlots['leftHand'] = this.addElement(handsContainer, 'inventory-slot dialog hidden');
		this.inventorySlots['rightHand'] = this.addElement(handsContainer, 'inventory-slot dialog hidden');
		const backpackContainer = this.addElement(this.inventory, 'row');
		this.inventorySlots['backpack'] = this.addElement(backpackContainer, 'inventory-slot dialog hidden');

		this.speedometer = this.addElement(this.dom, 'dialog fixed hidden');

		this.interactionDialog = this.addElement(this.dom, 'interaction-dialog dialog hidden');
		this.interactionName = this.addElement(this.interactionDialog,'interaction-name');
		this.interactHint = this.addElement(this.interactionDialog,'interact-hint hint hidden');
		this.interactHint.innerHTML = 'press <strong>E</strong> to interact';
		this.itemHint = this.addElement(this.interactionDialog,'interact-hint hint hidden');
		this.itemHint.innerHTML = 'press <strong>E</strong> to pick up';
		this.exitHint = this.addElement(this.interactionDialog,'interact-hint hint hidden');
		this.exitHint.innerHTML = 'press <strong>E</strong> to enter';
		this.talkHint = this.addElement(this.interactionDialog,'interact-hint hint hidden');
		this.talkHint.innerHTML = 'press <strong>E</strong> to talk';

		this.talkDialog = this.addElement(this.dom, 'talk-dialog dialog talk hidden');
		const talkHeaderContainer = this.addElement(this.talkDialog, 'talk-header');
		this.talkPortrait = this.addElement(talkHeaderContainer, 'talk-portrait');
		this.talkName = this.addElement(talkHeaderContainer, 'talk-name');
		this.talkText = this.addElement(this.talkDialog,'talk-text');
		this.continueHint = this.addElement(this.talkDialog,'continue-hint hint');
		this.continueHint.innerHTML = 'press any key to continue';

		this.controls = new Controls();

		// add to window for simple usage in dev console
		this.story = window.story = new StoryHelper(this);
		this.story.load();
		//console.log(this.story.state);

		this.player = new Player(this);

		this.showInteraction({ name: 'Loading...'});
		this.player.loadFile(
			'levels/' + this.story.getLevel() + '/app.json?v=' + Math.random(),
			() =>  {
				this.story.processUserData(this.player.userdata);
				this.hideInteraction();
				this.showInventory();
				this.player.play();
			}
		);
	}

	loadLevel(name) {
		this.story.setLevel(name);
		this.disposePlayer();
		window.location = window.location;
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
		this.hideInventory();

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
		this.showInventory();
	}

	showInventory() {
		this.showElement(this.inventory);
	}

	hideInventory() {
		this.hideElement(this.inventory);
	}

	showInventoryItem(slot, data) {
		const element = this.inventorySlots[slot];
		const portrait = 'portraits/' + data.portrait + '.png';
		element.innerHTML = '<img src="' + portrait + '" />';
		this.showElement(element);
	}

	hideInventoryItem(slot) {
		const element = this.inventorySlots[slot];
		this.hideElement(element);
	}

	createElement(tag, cls) {
		const element = document.createElement(tag);
		element.className = cls;
		return element;
	}

	addElement(parent, cls) {
		const element = this.createElement('div', cls);
		parent.appendChild(element);
		return element;
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
