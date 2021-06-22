import {PUCELLA_DISTANCE, PUCELLA_STATE_CLOSED, PucellaState} from "./PucellaState.js";

export default class PucellaStateIdle extends PucellaState {

	activate() {
		this.pucella.animation.activateAction('Open', 500, true);
		this.timeout = 5000;
	}

	update(event) {
		const dist = this.pucella.distanceToAntBob();
		if (dist < PUCELLA_DISTANCE) {
			this.changeState(PUCELLA_STATE_CLOSED);
			return;
		}
	}

}
