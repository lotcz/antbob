export const PUCELLA_STATE_IDLE = 1;
export const PUCELLA_STATE_CLOSED = 2;
export const PUCELLA_STATE_EATING = 3;
export const PUCELLA_STATE_OPEN = 4;

export const PUCELLA_DISTANCE = 3;

export class PucellaState {

	constructor(pucella) {
		this.pucella = pucella;
	}

	changeState(state) {
		this.pucella.changeState(state);
	}

	isActionRequired() {
		return false;
	}

	yieldState() {
		if (this.isActionRequired()) {
			this.changeState(PUCELLA_STATE_CLOSED);
			return;
		}
		this.changeState(PUCELLA_STATE_IDLE);
	}

	activate() {
	}

	deactivate() {
	}

	update(event) {
	}

}
