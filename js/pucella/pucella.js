import AnimationHelper from "../animation.js";
import {PUCELLA_STATE_CLOSED, PUCELLA_STATE_IDLE} from "./PucellaState.js";
import PucellaStateIdle from "./PucellaStateIdle.js";
import PucellaStateClosed from "./PucellaStateClosed.js";

export default class Pucella {

	constructor(player) {
		this.player = player;

		// STATES
		this.states = []
		this.states[PUCELLA_STATE_IDLE] = new PucellaStateIdle(this);
		this.states[PUCELLA_STATE_CLOSED] = new PucellaStateClosed(this);
	}

	async load(threeObject, data) {
		this.animation = new AnimationHelper(this.player, 'models/pucella.glb?v=3');
		this.model = await this.animation.load();
		this.model.position.copy(threeObject.position);
		this.model.quaternion.copy(threeObject.quaternion);
		this.model.scale.copy(threeObject.scale);
		threeObject.parent.add(this.model);
		this.changeState(PUCELLA_STATE_IDLE);
	}

	changeState(state, event) {
		if (this.state) this.state.deactivate();
		this.state = this.states[state];
		this.state.activate();
		if (event) this.state.update(event);
	}

	update(event) {
		this.animation.update(event);
		this.state.update(event);
	}

	distanceToAntBob() {
		return this.player.antbob.distanceTo(this.model.position);
	}

}
