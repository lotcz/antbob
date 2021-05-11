export default class StoryHelper {

	constructor() {
		this.reset();
	}

	// new game
	reset() {
		this.state = {
			lastLevel: null,
			level: 'level0',
			accomplished: {}
		}
	}

	load() {
		var item = localStorage.getItem('antbob');
		if (item) {
			this.state = JSON.parse(item);
		}
	}

	save() {
		localStorage.setItem('antbob', JSON.stringify(this.state));
	}

	accomplish(name, value = true) {
		this.state.accomplished[name] = value;
		this.save();
	}

	isAccomplished(name) {
		return name in this.state.accomplished;
	}

	do(name) {
		this.accomplish(name);
	}

	undo(name) {
		this.accomplish(name, false);
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

}
