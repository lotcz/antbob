export default class StoryHelper {

	constructor(ui) {
		this.ui = ui;
		this.reset();
	}

	// new game
	restart() {
		this.reset();
		this.save();
		var level = this.getLevel();
		this.setLevel(null);
		this.ui.loadLevel(level);
	}

	reset() {
		this.state = {
			lastLevel: null,
			level: 'level0',
			accomplished: {},
			inventory: {
				leftHand: null,
				rightHand: null,
				backpack: null,
				head: null
			}
		}
	}

	load() {
		var item = localStorage.getItem('antbob');
		if (item) {
			this.state = JSON.parse(item);
			for (let slot in this.state.inventory) {
				this.updateUIInventorySlot(slot);
			}
		}
	}

	save() {
		localStorage.setItem('antbob', JSON.stringify(this.state));
	}

	accomplish(name, value = true) {
		this.state.accomplished[name] = value;
		this.runTrigger(name);
		this.save();
	}

	isAccomplished(name) {
		return (name in this.state.accomplished) && this.state.accomplished[name];
	}

	do(name) {
		this.accomplish(name);
	}

	undo(name) {
		this.accomplish(name, false);
	}

	toggle(name) {
		this.accomplish(name, !this.isAccomplished(name));
	}

	isDone(name) {
		return this.isAccomplished(name);
	}

	setLevel(level) {
		this.state.lastLevel = this.state.level;
		this.state.level = level;
		this.save();
	}

	getLevel() {
		return this.state.level;
	}

	getLastLevel() {
		return this.state.lastLevel;
	}

	processUserData(userdata) {
		this.triggers = [];
		// create triggers
		for (var i = 0; i < userdata.userData.story.length; i++) {
			let udata = userdata.userData.story[i];
			if (udata.data.type == 'visible') {
				this.addTrigger(udata.data.when, true, () => this.makeVisible(udata.node));
				this.addTrigger(udata.data.when, false, () => this.makeInvisible(udata.node));
			}
			if (udata.data.type == 'invisible' || udata.data.type == 'hidden') {
				this.addTrigger(udata.data.when, true, () => this.makeInvisible(udata.node));
				this.addTrigger(udata.data.when, false, () => this.makeVisible(udata.node));
			}
		}

		// run triggers
		for (var accomplishment in this.state.accomplished) {
			this.runTrigger(accomplishment);
		}
	}

	addTrigger(accomplishment, done, trigger) {
		var triggerObject = this.triggers[accomplishment];
		if (!triggerObject) {
			triggerObject = {
				on: [],
				off: []
			}
			this.triggers[accomplishment] = triggerObject;
		}
		var triggers = (done) ? triggerObject.on : triggerObject.off;
		triggers.push(trigger);
	}

	runTrigger(accomplishment) {
		var triggerObject = this.triggers[accomplishment];
		if (!triggerObject) return;
		var triggers = this.isAccomplished(accomplishment) ? triggerObject.on : triggerObject.off;
		for (var i = 0, max = triggers.length; i < max; i++) {
			triggers[i]();
		}
	}

	makeVisible(node) {
		node.visible = true;
	}

	makeInvisible(node) {
		node.visible = false;
	}

	 /* inventory */
	hasInventoryItem(slot) {
		if (slot === 'rightHand' && this.hasItemInBothHands('leftHand')) {
			return true;
		}
		return (slot in this.state.inventory) && (this.state.inventory[slot] != null);
	}

	hasItemInBothHands() {
		return (this.hasInventoryItem('leftHand') && this.state.inventory['leftHand'].slot === 'both');
	}

	addInventoryItem(slot, data) {
		if (slot === 'hand') slot = this.hasInventoryItem('leftHand') ? 'rightHand' : 'leftHand';
		if (slot === 'both') slot = this.hasInventoryItem('rightHand') ? 'rightHand' : 'leftHand';

		if (this.hasInventoryItem(slot)) {
			return false;
		}

		this.state.inventory[slot] = data;
		this.save();
		this.updateUIInventorySlot(slot);
		return slot;
	}

	removeInventoryItem(slot) {
		if (this.hasInventoryItem(slot)) {
			const data = this.state.inventory[slot];
			this.state.inventory[slot] = null;
			this.save();
			this.updateUIInventorySlot(slot);
			return data;
		}
	}

	updateUIInventorySlot(slot) {
		if (this.hasInventoryItem(slot))
			this.ui.showInventoryItem(slot, this.state.inventory[slot]);
		else
			this.ui.hideInventoryItem(slot);
	}

}
