import {PUCELLA_DISTANCE, PUCELLA_STATE_CLOSED, PUCELLA_STATE_IDLE, PucellaState} from "./PucellaState.js";

export default class PucellaStateClosed extends PucellaState {

	activate() {
		this.pucella.animation.activateAction('Closed', 500, true);
		this.timeout = 10000;
	}

	update(event) {
		const dist = this.pucella.distanceToAntBob();
		if (dist > PUCELLA_DISTANCE) {
			this.changeState(PUCELLA_STATE_IDLE);
			return;
		}
	}

}
