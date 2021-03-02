export default class Controls {

	constructor() {
		this.movementEnabled = true;
		this.reset();

		window.addEventListener( 'keydown', (e) => this.onKeyDown(e), false );
		window.addEventListener( 'keyup', (e) => this.onKeyUp(e), false );
	}

	anyMovement() {
		return this.moveForward || this.moveLeft || this.moveBackward || this.moveRight;
	}

	onKeyDown(event) {
		if (this.movementEnabled) {
			switch ( event.keyCode ) {
				case 38: /*up*/
				case 87: /*W*/ this.moveForward = true; break;
				case 37: /*left*/
				case 65: /*A*/ this.moveLeft = true; break;
				case 40: /*down*/
				case 83: /*S*/ this.moveBackward = true; break;
				case 39: /*right*/
				case 68: /*D*/ this.moveRight = true; break;
				case 69: /*E*/ this.interact = true; break;
				case 32: /*space*/ this.jump = true; break;
				//case 17: /*Ctrl*/ this.fire = true; break;
				case 13: this.fire = true; break;
			}
		}
	};

	onKeyUp(e) {
		var key = e.keyCode ? e.keyCode : e.charCode;
		//console.log("key:" + key);
		if (this.movementEnabled) {
			switch( key ) {
				case 38: /*up*/
				case 87: /*W*/ this.moveForward = false; break;
				case 37: /*left*/
				case 65: /*A*/ this.moveLeft = false; break;
				case 40: /*down*/
				case 83: /*S*/ this.moveBackward = false; break;
				case 39: /*right*/
				case 68: /*D*/ this.moveRight = false; break;
				case 69: /*E*/ this.interact = false; break;
				case 82: /*R*/ this.moveUp = false; break;
				case 70: /*F*/ this.moveDown = false; break;
				case 32: /*space*/ this.jump = false; break;
				case 13: this.fire = false; break;
			}
		}
	};

	reset() {
		this.moveForward = false;
		this.moveLeft = false;
		this.moveBackward = false;
		this.moveRight = false;
		this.jump = false;
		this.fire = false;
		this.interact = false;
	}

	enableMovement() {
		this.movementEnabled = true;
	}

	disableMovement() {
		this.movementEnabled = false;
		this.reset();
	}

}
