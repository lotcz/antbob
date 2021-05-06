export default class SoundHelper {

	constructor(src, loop = true) {
		this.sound = document.createElement("audio");
		this.sound.src = src;
		this.sound.setAttribute("preload", "auto");
		this.sound.setAttribute("controls", "none");
		this.sound.style.display = "none";
		document.body.appendChild(this.sound);
		this.setLoop(loop);
	}

	play() {
		this.sound.play();
	}

	stop() {
		this.sound.pause();
	}

	setLoop(loop) {

	}

}
