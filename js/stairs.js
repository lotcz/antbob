export default class StairsHelper {

	constructor(player) {
		this.player = player;
		this.processUserData(player.userdata.userData.stairs);
	}

	processUserData(userdata) {
		for (var i = 0; i < userdata.length; i++) {
			var start = userdata[i].node;
			var data = userdata[i].data;
			var end = this.player.scene.getObjectByName(data.end);
			var height = start.geometry.parameters.height * start.scale.y;
			var distance = end.position.clone().sub(start.position);
			var yDist = distance.y;
			var steps = Math.ceil(yDist / height);
			var stepTransform = distance.multiplyScalar(1 / steps);
			var stepAngle = start.quaternion.angleTo(end.quaternion) / steps;

			var lastStep = start;
			steps -= 1;
			for (var si = 0; si < steps; si++) {
				let step = lastStep.clone();
				var pos = lastStep.position.clone();
				pos.add(stepTransform);
				step.position.set(pos.x, pos.y, pos.z);
				step.quaternion.rotateTowards(end.quaternion, stepAngle);
				lastStep.parent.add(step);
				step.userData = { physics: lastStep.userData.physics };
				this.player.userdata.extractUserData(step);
				lastStep = step;
			}

		}
	}

}
