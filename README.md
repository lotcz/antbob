## Install

    git clone https://github.com/lotcz/antbob.git antbob
    cd antbob
    npm install

## API

### Level

Put this on scene object:

```
{
  "camera": {
    "name": "PerspectiveCamera"
  }
}
```

Put this on camera:

```
{
  "type": "focus"
}
```

### Physics

	- rigidBox
	- rigidSphere
	- rigidCylinder

```
{
  "physics": {
    "type": "rigidBox",
    "mass": 0
  }
}

{
  "physics": {
    "type": "rigidCylinder",
    "mass": 0
  }
}
```

Soft body:

```
{
  "physics": {
    "type": "softBody",
    "mass": 0.1,
    "pressure": 7,
    "stiffness": 0.9
  }
}
```

### Story and Interaction

```
{
  "story": {
    "type": "visible",
    "when": "switch-light"
  }
}
```

```
{
  "interaction": {
    "name": "Blue Light",
    "maxDistance": 1,
    "interact": {
      "type": "toggle",
      "accomplishment": "switch-light"
    }
  }
}
```

### Editor scripts

Spot light:
```
var spotInitV = new THREE.Vector3();
var spotTargetV = new THREE.Vector3();

function init() {
	spotInitV.copy(this.position);
	spotInitV.z = spotInitV.z - 100;
	spotTargetV.copy(spotInitV);
}

function update( event ) {
	var phase = event.time % 10000;
	if (phase > 5000) phase = 10000 - phase;
	phase -= 2500;
	spotTargetV.y = spotInitV.y + (phase/300);
	this.lookAt(spotTargetV);
}
```

Animation:

```
function init() {
	this.mixer = new THREE.AnimationMixer( this );
	const clip = THREE.AnimationClip.findByName( this.animations, "Idle" );

	if ( clip ) {
		console.log(clip);
		const action = this.mixer.clipAction( clip );
		action.play();
	}

}

function update(event) {
	this.mixer.update(event.delta / 1000);
}
```
