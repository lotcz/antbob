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
### Editor scripts

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
