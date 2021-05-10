## Install

    git clone https://github.com/lotcz/antbob.git antbob
    cd antbob
    npm install

## API

### Level

Put this on scene object:

    {
      "camera": {
        "name": "PerspectiveCamera"
      }
    }

Put this on camera:

    {
      "type": "focus"
    }

### Physics

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
