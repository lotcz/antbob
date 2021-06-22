import Pucella from "./pucella.js";

export default class PucellaHelper {

	constructor(player) {
		this.player = player;
		this.userdata = player.userdata;
		this.pucellas = [];
	}

	async load() {
		const tasks = [];
		this.pucellas = [];
		for (let i = 0; i < this.userdata.userData.pucella.length; i++) {
			const udata = this.userdata.userData.pucella[i];
			const pucella = new Pucella(this.player);
			tasks.push(pucella.load(udata.node, udata.data));
			this.pucellas.push(pucella);
		}
		await Promise.all(tasks);
	}

	update(event) {
		for (let i = 0, max = this.pucellas.length; i < max; i++) {
			this.pucellas[i].update(event);
		}
	}

}
