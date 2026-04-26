export function registerBlocks(Blockly, assetHelpers) {
    const { getModelAssets, getAudioAssets, getImageAssets } = assetHelpers;
Blockly.Blocks['asset_model'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("model asset")
                    .appendField(new Blockly.FieldDropdown(getModelAssets), "ASSET");
                this.setOutput(true, "String");
                this.setColour('#A55B5B');
                this.setTooltip("Selects a model asset.");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['asset_audio'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("audio asset")
                    .appendField(new Blockly.FieldDropdown(getAudioAssets), "ASSET");
                this.setOutput(true, "String");
                this.setColour('#A55B5B');
                this.setTooltip("Selects an audio asset.");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['asset_image'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("image asset")
                    .appendField(new Blockly.FieldDropdown(getImageAssets), "ASSET");
                this.setOutput(true, "String");
                this.setColour('#A55B5B');
                this.setTooltip("Selects an image asset.");
                this.setHelpUrl("");
            }
        };

        Blockly.defineBlocksWithJsonArray([
            {
                "type": "take_screenshot",
                "message0": "take screenshot",
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5BA55B",
                "tooltip": "Takes a screenshot of the current view and downloads it.",
                "helpUrl": ""
            },
            {
                "type": "set_pixelated_look",
                "message0": "set pixelated look on %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#4C97FF",
                "tooltip": "Sets the sampling mode of all textures on the object to Nearest to achieve a pixelated look.",
                "helpUrl": ""
            },
            {
                "type": "set_background_image",
                "message0": "set background image from URL %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "URL",
                        "check": "String"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#59C059",
                "tooltip": "Sets the scene background to an image from the specified URL.",
                "helpUrl": ""
            },
            {
                "type": "play_animation_by_index",
                "message0": "play animation index %1 on %2 loop %3",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "INDEX",
                        "check": "Number"
                    },
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    },
                    {
                        "type": "field_checkbox",
                        "name": "LOOP",
                        "checked": true
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#FF6347",
                "tooltip": "Plays an animation from the model by its index.",
                "helpUrl": ""
            },
            {
                "type": "import_model_from_asset",
                "message0": "import model from asset %1 as %2",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "ASSET",
                        "check": "String"
                    },
                    {
                        "type": "field_variable",
                        "name": "VAR",
                        "variable": "model"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_MATH_HUE}",
                "tooltip": "Imports a model from the asset manager.",
                "helpUrl": ""
            },
            {
                "type": "play_sound_from_asset",
                "message0": "play sound from asset %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "ASSET",
                        "check": "String"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_AUDIO_HUE}",
                "tooltip": "Plays a sound from the asset manager.",
                "helpUrl": ""
            },
            {
                "type": "set_texture_from_asset",
                "message0": "set texture of %1 to asset %2",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    },
                    {
                        "type": "input_value",
                        "name": "ASSET",
                        "check": "String"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_MATH_HUE}",
                "tooltip": "Sets the texture of an object from an image asset.",
                "helpUrl": ""
            },
            {
                "type": "position_model",
                "message0": "position model %1 at X %2 Y %3 Z %4",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "MODEL"
                    },
                    {
                        "type": "input_value",
                        "name": "X"
                    },
                    {
                        "type": "input_value",
                        "name": "Y"
                    },
                    {
                        "type": "input_value",
                        "name": "Z"
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160,
                "tooltip": "Sets the position of the model to the specified X, Y, and Z coordinates",
                "helpUrl": ""
            },
            {
                "type": "point_camera_at_mesh",
                "message0": "point camera at mesh %1",
                "args0": [
                    {
                        "type": "field_variable",
                        "name": "MESH",
                        "variable": "mesh"
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 230,
                "tooltip": "Points the camera at the specified mesh",
                "helpUrl": ""
            },
            {
                type: 'import_3d_file_url',
                message0: 'Import model URL %1\r\n',
                args0: [
                    {
                        type: 'field_input',
                        name: 'MODEL_URL',
                        text: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
                    }
                ],
                message1: 'Place at X %1 Y %2 Z %3',
                args1: [
                    {
                        type: 'field_number',
                        name: 'POS_X',
                        value: 0,
                    },
                    {
                        type: 'field_number',
                        name: 'POS_Y',
                        value: 0,
                    },
                    {
                        type: 'field_number',
                        name: 'POS_Z',
                        value: 0,
                    },
                ],
                colour: 160,
                tooltip: 'Imports a 3D file from a URL and executes actions on success.',
                output: "Mesh",
                helpUrl: '',
                extensions: [
                    'set_max_display_length',
                ],
            },
            {
                type: 'set_isometric_camera',
                message0: 'Set camera to isometric view',
                args0: [],
                previousStatement: null,
                nextStatement: null,
                colour: 160,
                tooltip: 'Sets the active camera to an isometric angle pointing at the origin.',
                helpUrl: '',
            },
            {
                type: 'set_fps_camera',
                message0: 'set first-person camera on %1',
                args0: [
                    {
                        type: 'input_value',
                        name: 'OBJECT',
                    },
                ],
                previousStatement: null,
                nextStatement: null,
                colour: 160,
                tooltip: 'Attaches a first-person camera to the specified object.',
                helpUrl: '',
            },
            {
                type: 'create_primitive',
                message0: 'Create %1 named %2 at x %3 y %4 z %5',
                args0: [
                    {
                        type: 'field_dropdown',
                        name: 'TYPE',
                        options: [
                            ['box', 'box'],
                            ['sphere', 'sphere'],
                            ['cylinder', 'cylinder']
                        ],
                    },
                    { "type": "input_value", "name": "NAME", "check": "String" },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'Z', check: 'Number' },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 160,
                tooltip: 'Creates a 3D primitive at the specified position.',
            },
            {
                type: 'create_box',
                message0: 'Create box named %1 at x %2 y %3 z %4',
                args0: [
                    { "type": "input_value", "name": "NAME", "check": "String" },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'Z', check: 'Number' },
                ],
                "inputsInline": true,
                output: "Mesh",
                colour: 160,
                tooltip: 'Creates a box at the specified position and returns it.',
            },
            {
                type: 'create_sphere',
                message0: 'Create sphere at x %1 y %2 z %3',
                args0: [
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'Z', check: 'Number' },
                ],
                "inputsInline": true,
                output: "Mesh",
                colour: 160,
                tooltip: 'Creates a sphere at the specified position and returns it.',
            },
            {
                "type": "create_3d_text",
                "message0": "create 3D text %1 named %2",
                "args0": [
                    { "type": "input_value", "name": "TEXT", "check": "String" },
                    { "type": "input_value", "name": "NAME", "check": "String" },
                ],
                "message1": "font URL %1",
                "args1": [
                    { "type": "field_input", "name": "FONT_URL", "text": "https://assets.babylonjs.com/fonts/Droid Sans_Bold.json" }
                ],
                "output": "Mesh",
                "colour": 160,
                "inputsInline": false,
                "tooltip": "Creates a 3D text mesh.",
                "helpUrl": ""
            },
            {
                "type": "scale_object",
                "message0": "scale object %1 by x %2 y %3 z %4",
                "args0": [
                    { "type": "input_value", "name": "OBJECT" },
                    { "type": "input_value", "name": "X", "check": "Number" },
                    { "type": "input_value", "name": "Y", "check": "Number" },
                    { "type": "input_value", "name": "Z", "check": "Number" }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 210,
                "tooltip": "Scales an object."
            },
            {
                "type": "get_property",
                "message0": "get property %1 of object %2",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "PROPERTY",
                        "check": "String"
                    },
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    }
                ],
                "output": null,
                "colour": 230,
                "tooltip": "Gets a property from an object.",
                "helpUrl": ""
            },
            {
                "type": "set_metadata",
                "message0": "set metadata key %1 on object %2 to value %3",
                "args0": [
                    { "type": "input_value", "name": "KEY", "check": "String" },
                    { "type": "input_value", "name": "OBJECT" },
                    { "type": "input_value", "name": "VALUE" }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 230,
                "tooltip": "Sets a metadata key-value pair on an object."
            },
            {
                "type": "get_metadata",
                "message0": "get metadata key %1 from object %2",
                "args0": [
                    { "type": "input_value", "name": "KEY", "check": "String" },
                    { "type": "input_value", "name": "OBJECT" }
                ],
                "output": null,
                "colour": 230,
                "tooltip": "Gets a metadata value from an object by its key."
            },
            {
                "type": "set_property",
                "message0": "set property %1 of %2 to %3",
                "args0": [
                    { "type": "input_value", "name": "PROPERTY", "check": "String" },
                    { "type": "input_value", "name": "TARGET" },
                    { "type": "input_value", "name": "VALUE" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 230,
                "tooltip": "Sets a raw property on a Babylon.js mesh (e.g., 'visibility' or 'material.alpha')."
            },
            {
                type: 'move_object',
                message0: 'Move object %1 to x %2 y %3 z %4',
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'Z', check: 'Number' },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 210,
                tooltip: 'Moves an object to the specified position',
            },
            {
                type: 'create_light',
                message0: 'Create light named %1 at x %2 y %3 z %4',
                args0: [
                    { type: 'field_input', name: 'NAME', text: 'light' },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'Z', check: 'Number' },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 65,
                tooltip: 'Creates a light at the specified position',
            },
            {
                type: 'change_object_color',
                message0: 'Change color of %1 to %2',
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'COLOR' },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 210,
                tooltip: 'Changes the color of the specified object',
            },
            {
                type: 'rotate_object',
                message0: 'Rotate %1 by x %2 y %3 z %4 degrees',
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'Z', check: 'Number' },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 120,
                tooltip: 'Rotates an object by the specified angles',
            },
            {
                "type": "create_keyframe",
                "message0": "keyframe at %1 value %2",
                "args0": [
                    { "type": "input_value", "name": "FRAME", "check": "Number" },
                    { "type": "input_value", "name": "VALUE" }
                ],
                "output": "Keyframe",
                "colour": 300,
                "tooltip": "Defines a single keyframe with a frame number and value."
            },
            {
                "type": "animate_keyframes",
                "message0": "animate property %1 of %2",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "PROPERTY",
                        "options": [
                            ["position", "position"],
                            ["rotation", "rotation"],
                            ["scaling", "scaling"],
                            ["visibility", "visibility"]
                        ]
                    },
                    { "type": "input_value", "name": "OBJECT" }
                ],
                "message1": "with keyframes %1",
                "args1": [
                    { "type": "input_value", "name": "KEYFRAMES", "check": "Array" }
                ],
                "message2": "loop %1",
                "args2": [
                    {
                        "type": "field_dropdown",
                        "name": "LOOP",
                        "options": [
                            ["no", "NO"],
                            ["yes", "YES"],
                            ["ping-pong", "PINGPONG"]
                        ]
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 300,
                "tooltip": "Animates a property using a list of keyframes."
            },
            {
                "type": "animate_object",
                "message0": "animate property %1 of %2",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "PROPERTY",
                        "options": [
                            ["visibility", "visibility"]
                        ]
                    },
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    }
                ],
                "message1": "from %1 to %2 over %3 seconds",
                "args1": [
                    { "type": "input_value", "name": "FROM", "check": "Number" },
                    { "type": "input_value", "name": "TO", "check": "Number" },
                    { "type": "input_value", "name": "DURATION", "check": "Number" }
                ],
                "message2": "loop %1",
                "args2": [
                    {
                        "type": "field_dropdown",
                        "name": "LOOP",
                        "options": [
                            ["no", "NO"],
                            ["yes", "YES"],
                            ["ping-pong", "PINGPONG"]
                        ]
                    }
                ],
                "inputsInline": false,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 300,
                "tooltip": "Animates a property of an object over a duration."
            },
            {
                "type": "import_animation",
                "message0": "import animation from url %1 as %2",
                "args0": [
                    {
                        type: 'field_input',
                        name: 'URL',
                        text: 'https://cdn.digitaleducationsafety.org/assets/models/animations/run_forward.fbx',
                    },
                    { "type": "field_variable", "name": "VAR", "variable": "animation" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_MOTION_HUE}",
                "tooltip": "Imports a skeletal animation from a URL (.fbx)."
            },
            {
                "type": "apply_animation",
                "message0": "apply animation %1 to model %2",
                "args0": [
                    { "type": "input_value", "name": "ANIMATION" },
                    { "type": "input_value", "name": "MODEL" }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_MOTION_HUE}",
                "tooltip": "Applies an imported animation to a model."
            },
            {
                "type": "play_animation",
                "message0": "play animation on %1 from frame %2 to %3 loop %4",
                "args0": [
                    { "type": "input_value", "name": "MODEL" },
                    { "type": "input_value", "name": "FROM", "check": "Number" },
                    { "type": "input_value", "name": "TO", "check": "Number" },
                    { "type": "field_checkbox", "name": "LOOP", "checked": true }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_MOTION_HUE}",
                "tooltip": "Plays a skeletal animation on a model."
            },
            {
                "type": "stop_skeletal_animation",
                "message0": "stop skeletal animation on %1",
                "args0": [
                    { "type": "input_value", "name": "OBJECT" }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 300,
                "tooltip": "Stops skeletal animations on the specified object."
            },
            {
                "type": "stop_animation",
                "message0": "stop property animation on %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 300,
                "tooltip": "Stops all property animations (e.g., position, rotation, scale) on the specified object."
            },
            {
                "type": "animate_rotation",
                "message0": "animate rotation of %1 to x %2 y %3 z %4 degrees over %5 seconds",
                "args0": [
                    { "type": "input_value", "name": "OBJECT" },
                    { "type": "input_value", "name": "X", "check": "Number" },
                    { "type": "input_value", "name": "Y", "check": "Number" },
                    { "type": "input_value", "name": "Z", "check": "Number" },
                    { "type": "input_value", "name": "DURATION", "check": "Number" }
                ],
                "message1": "loop %1",
                "args1": [
                    {
                        "type": "field_dropdown",
                        "name": "LOOP",
                        "options": [["no", "NO"], ["yes", "YES"], ["ping-pong", "PINGPONG"]]
                    }
                ],
                "inputsInline": false,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 300,
                "tooltip": "Animates the rotation of an object."
            },
            {
                "type": "animate_position",
                "message0": "animate position of %1 to x %2 y %3 z %4 over %5 seconds",
                "args0": [
                    { "type": "input_value", "name": "OBJECT" },
                    { "type": "input_value", "name": "X", "check": "Number" },
                    { "type": "input_value", "name": "Y", "check": "Number" },
                    { "type": "input_value", "name": "Z", "check": "Number" },
                    { "type": "input_value", "name": "DURATION", "check": "Number" }
                ],
                "message1": "loop %1",
                "args1": [
                    {
                        "type": "field_dropdown",
                        "name": "LOOP",
                        "options": [["no", "NO"], ["yes", "YES"], ["ping-pong", "PINGPONG"]]
                    }
                ],
                "inputsInline": false,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 300,
                "tooltip": "Animates the position of an object."
            },
            {
                "type": "animate_scale",
                "message0": "animate scale of %1 to x %2 y %3 z %4 over %5 seconds",
                "args0": [
                    { "type": "input_value", "name": "OBJECT" },
                    { "type": "input_value", "name": "X", "check": "Number" },
                    { "type": "input_value", "name": "Y", "check": "Number" },
                    { "type": "input_value", "name": "Z", "check": "Number" },
                    { "type": "input_value", "name": "DURATION", "check": "Number" }
                ],
                "message1": "loop %1",
                "args1": [
                    {
                        "type": "field_dropdown",
                        "name": "LOOP",
                        "options": [["no", "NO"], ["yes", "YES"], ["ping-pong", "PINGPONG"]]
                    }
                ],
                "inputsInline": false,
                "previousStatement": null,
                "nextStatement": null,
                "colour": 300,
                "tooltip": "Animates the scale of an object."
            },
            {
                type: 'enable_physics',
                message0: 'Enable physics on %1 with mass %2 and impostor %3',
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'MASS', check: 'Number' },
                    {
                        type: 'field_dropdown',
                        name: 'IMPOSTOR',
                        options: [
                            ['Box', 'BABYLON.PhysicsImpostor.BoxImpostor'],
                            ['Sphere', 'BABYLON.PhysicsImpostor.SphereImpostor'],
                            ['Cylinder', 'BABYLON.PhysicsImpostor.CylinderImpostor'],
                            ['Plane', 'BABYLON.PhysicsImpostor.PlaneImpostor'],
                            ['Mesh', 'BABYLON.PhysicsImpostor.MeshImpostor']
                        ],
                    },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 120,
                tooltip: 'Enables physics on the specified object with the given mass',
            },
            {
                type: 'apply_force',
                message0: 'Apply force to %1 x: %2 y: %3 z: %4 at point x: %5 y: %6 z: %7',
                args0: [
                    { type: 'input_value', name: 'OBJECT' },
                    { type: 'input_value', name: 'FX', check: 'Number' },
                    { type: 'input_value', name: 'FY', check: 'Number' },
                    { type: 'input_value', name: 'FZ', check: 'Number' },
                    { type: 'input_value', name: 'PX', check: 'Number' },
                    { type: 'input_value', name: 'PY', check: 'Number' },
                    { type: 'input_value', name: 'PZ', check: 'Number' },
                ],
                "inputsInline": false,
                previousStatement: null,
                nextStatement: null,
                colour: 120,
                tooltip: 'Applies a force to the specified object at a given point',
            },
            {
                type: 'apply_impulse',
                message0: 'Apply impulse to %1 x: %2 y: %3 z: %4 at point x: %5 y: %6 z: %7',
                args0: [
                    { type: 'input_value', name: 'OBJECT' },
                    { type: 'input_value', name: 'FX', check: 'Number' },
                    { type: 'input_value', name: 'FY', check: 'Number' },
                    { type: 'input_value', name: 'FZ', check: 'Number' },
                    { type: 'input_value', name: 'PX', check: 'Number' },
                    { type: 'input_value', name: 'PY', check: 'Number' },
                    { type: 'input_value', name: 'PZ', check: 'Number' },
                ],
                "inputsInline": false,
                previousStatement: null,
                nextStatement: null,
                colour: 120,
                tooltip: 'Applies an impulse to the specified object at a given point',
            },
            {
                type: 'get_object_pos',
                message0: 'Get %1 position of %2',
                args0: [
                    {
                        type: 'field_dropdown',
                        name: 'AXIS',
                        options: [['X', 'X'], ['Y', 'Y'], ['Z', 'Z']]
                    },
                    { type: 'input_value', name: 'OBJECT' }
                ],
                output: 'Number',
                colour: 120,
                tooltip: 'Returns the X, Y, or Z position of an object'
            },
            {
                type: 'get_collided_object',
                message0: 'collided object',
                output: null,
                colour: 120,
                tooltip: 'To be used inside an onCollision callback'
            },
            {
                type: 'set_gravity',
                message0: 'Set scene gravity to x: %1 y: %2 z: %3',
                args0: [
                    { type: 'input_value', name: 'GX', check: 'Number' },
                    { type: 'input_value', name: 'GY', check: 'Number' },
                    { type: 'input_value', name: 'GZ', check: 'Number' },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 120,
                tooltip: 'Sets the gravity for the entire scene',
            },
            {
                type: 'set_physics_impostor',
                message0: 'Set physics impostor for %1 to %2',
                args0: [
                    { type: 'field_input', name: 'NAME', text: 'object' },
                    {
                        type: 'field_dropdown',
                        name: 'IMPOSTOR',
                        options: [
                            ['Box', 'BABYLON.PhysicsImpostor.BoxImpostor'],
                            ['Sphere', 'BABYLON.PhysicsImpostor.SphereImpostor'],
                            ['Plane', 'BABYLON.PhysicsImpostor.PlaneImpostor'],
                            ['Mesh', 'BABYLON.PhysicsImpostor.MeshImpostor']
                        ],
                    },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 120,
                tooltip: 'Sets the physics impostor type for the specified object',
            },
            {
                type: 'create_camera',
                message0: 'Create camera named %1 and save as %2',
                args0: [
                    { type: 'field_input', name: 'NAME', text: 'camera' },
                    {
                        type: 'field_variable',
                        name: 'MODEL_VAR',
                        variable: 'camera',
                    },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 180,
                tooltip: 'Creates a scene camera',
            },
            {
                type: 'create_ground',
                message0: 'Create ground with width %1 and height %2',
                args0: [
                    { type: 'input_value', name: 'WIDTH', check: 'Number' },
                    { type: 'input_value', name: 'HEIGHT', check: 'Number' }
                ],
                "inputsInline": true,
                output: "Mesh",
                colour: 180,
                tooltip: 'Creates a ground mesh with specified width and height',
            },
            {
                type: 'set_ground_material',
                message0: 'Set material %1 on ground %2',
                args0: [
                    { type: 'field_input', name: 'MATERIAL', text: 'material' },
                    { type: 'field_input', name: 'NAME', text: 'ground' },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 180,
                tooltip: 'Sets a material on the specified ground object',
            },
            {
                type: 'set_ground_physics',
                message0: 'Enable physics on ground %1 with impostor %2',
                args0: [
                    { type: 'field_input', name: 'NAME', text: 'ground' },
                    {
                        type: 'field_dropdown',
                        name: 'IMPOSTOR',
                        options: [
                            ['Plane', 'BABYLON.PhysicsImpostor.PlaneImpostor'],
                            ['Box', 'BABYLON.PhysicsImpostor.BoxImpostor'],
                        ],
                    },
                ],
                "inputsInline": true,
                previousStatement: null,
                nextStatement: null,
                colour: 180,
                tooltip: 'Enables physics on the ground object with the selected impostor',
            },
            // Scripting Blocks
            {
                "type": "select_object",
                "message0": "object named %1",
                "args0": [
                    {
                        "type": "field_input",
                        "name": "OBJECT_NAME",
                        "text": "myObject" // Default text
                    }
                ],
                "output": "String", // Outputs the object name/ID as a string
                "colour": "%{BKY_LOGIC_HUE}", // Using logic hue for now
                "tooltip": "Selects an object from the scene by its name.",
                "helpUrl": ""
            },
            // Phase 2 Blockly Blocks
            {
                "type": "event_on_click",
                "message0": "when %1 is clicked %2 do %3",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT_SELECTOR",
                        "check": "String"
                    },
                    {
                        "type": "input_dummy"
                    },
                    {
                        "type": "input_statement",
                        "name": "DO_CODE"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_LOOPS_HUE}",
                "tooltip": "Executes code when the specified object is clicked.",
                "helpUrl": ""
            },
            {
                "type": "event_every_frame",
                "message0": "for %1 every frame %2 do %3",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT_SELECTOR",
                        "check": "String"
                    },
                    {
                        "type": "input_dummy"
                    },
                    {
                        "type": "input_statement",
                        "name": "DO_CODE"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_LOOPS_HUE}",
                "tooltip": "Executes code for the specified object every frame.",
                "helpUrl": ""
            },
            {
                "type": "action_rotate_continuously",
                "message0": "rotate object %1 continuously by x %2 y %3 z %4 deg/sec",
                "args0": [
                    { type: 'input_value', name: 'NAME' },
                    {
                        "type": "input_value",
                        "name": "ROTATE_X_SPEED",
                        "check": "Number"
                    },
                    {
                        "type": "input_value",
                        "name": "ROTATE_Y_SPEED",
                        "check": "Number"
                    },
                    {
                        "type": "input_value",
                        "name": "ROTATE_Z_SPEED",
                        "check": "Number"
                    }
                ],
                "inputsInline": false,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_MATH_HUE}",
                "tooltip": "Continuously rotates the object. Use inside an 'every frame' block for the target object.",
                "helpUrl": ""
            },
            // Controller Block
            {
                "type": "on_button_press",
                "message0": "on %1 button pressed %2 do %3",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "BUTTON",
                        "options": [
                            ["A", "A"],
                            ["B", "B"],
                            ["Left", "Left"],
                            ["Right", "Right"],
                            ["Up", "Up"],
                            ["Down", "Down"]
                        ]
                    },
                    {
                        "type": "input_dummy"
                    },
                    {
                        "type": "input_statement",
                        "name": "DO"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_LOOPS_HUE}",
                "tooltip": "Executes code when a controller button is pressed.",
                "helpUrl": ""
            },
            {
                "type": "get_joystick_direction",
                "message0": "joystick direction",
                "output": "Number",
                "colour": "%{BKY_LOGIC_HUE}",
                "tooltip": "Gets the current direction of the joystick in degrees.",
                "helpUrl": ""
            },
            {
                "type": "get_joystick_force",
                "message0": "joystick force",
                "output": "Number",
                "colour": "%{BKY_LOGIC_HUE}",
                "tooltip": "Gets the current force of the joystick (0 to 1).",
                "helpUrl": ""
            },
            {
                "type": "player_jump",
                "message0": "make player jump with force %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "FORCE",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#4C97FF",
                "tooltip": "Makes the player character jump.",
                "helpUrl": ""
            },
            {
                "type": "player_move",
                "message0": "move player with speed %1 in direction %2",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "SPEED",
                        "check": "Number"
                    },
                    {
                        "type": "field_dropdown",
                        "name": "DIRECTION",
                        "options": [
                            ["forward", "FORWARD"],
                            ["backward", "BACKWARD"],
                            ["left", "LEFT"],
                            ["right", "RIGHT"]
                        ]
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#4C97FF",
                "tooltip": "Moves the player character in a direction.",
                "helpUrl": ""
            },
            // Gameplay Blocks
            {
                "type": "on_collision",
                "message0": "when %1 collides with %2 %3 do %4",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT1",
                        "check": ["String", "Mesh"]
                    },
                    {
                        "type": "input_value",
                        "name": "OBJECT2",
                        "check": ["Array", "String", "Mesh"]
                    },
                    {
                        "type": "input_dummy"
                    },
                    {
                        "type": "input_statement",
                        "name": "DO"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5BA55B",
                "tooltip": "Executes code when two objects collide. Can check against a single object or a list of objects.",
                "helpUrl": "",
                "extraState": {
                    "hasCollidedObjectVar": true
                }
            },
            {
                "type": "destroy_object",
                "message0": "destroy object %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5BA55B",
                "tooltip": "Destroys the specified object.",
                "helpUrl": ""
            },
            {
                "type": "set_as_player",
                "message0": "set %1 as player",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#4C97FF",
                "tooltip": "Designates the specified object as the player character.",
                "helpUrl": ""
            },
            {
                "type": "camera_follow",
                "message0": "make camera follow %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "OBJECT",
                        "check": "String"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#A55B80",
                "tooltip": "Makes the camera follow the specified object.",
                "helpUrl": ""
            },
            {
                "type": "camera_zoom",
                "message0": "zoom camera by %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "ZOOM",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#A55B80",
                "tooltip": "Zooms the camera in or out.",
                "helpUrl": ""
            },
            {
                "type": "play_sound_url",
                "message0": "play sound from URL %1",
                "args0": [
                    {
                        "type": "field_input",
                        "name": "URL",
                        "text": "https://example.com/sound.mp3"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Plays a sound from a URL.",
                "helpUrl": ""
            },
            {
                "type": "play_note",
                "message0": "play note %1 for %2 seconds",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "NOTE",
                        "options": [
                            ["C4", "261.63"],
                            ["D4", "293.66"],
                            ["E4", "329.63"],
                            ["F4", "349.23"],
                            ["G4", "392.00"],
                            ["A4", "440.00"],
                            ["B4", "493.88"]
                        ]
                    },
                    {
                        "type": "input_value",
                        "name": "DURATION",
                        "check": "Number"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Plays a musical note for a given duration.",
                "helpUrl": ""
            },
            // GUI Blocks
            {
                "type": "gui_create_text_block",
                "message0": "create text block named %1 with text %2",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myText" },
                    { "type": "input_value", "name": "TEXT", "check": "String" }
                ],
                "message1": "align horizontal %1 vertical %2",
                "args1": [
                    {
                        "type": "field_dropdown", "name": "H_ALIGN",
                        "options": [["left", "0"], ["right", "1"], ["center", "2"]]
                    },
                    {
                        "type": "field_dropdown", "name": "V_ALIGN",
                        "options": [["top", "0"], ["bottom", "1"], ["center", "2"]]
                    }
                ],
                "message2": "at top %1 left %2",
                "args2": [
                    { "type": "input_value", "name": "TOP", "check": "String" },
                    { "type": "input_value", "name": "LEFT", "check": "String" }
                ],
                "inputsInline": false,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Creates a new text block in the GUI with positioning.",
                "helpUrl": ""
            },
            {
                "type": "gui_set_text",
                "message0": "set text of GUI element %1 to %2",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myText" },
                    { "type": "input_value", "name": "TEXT", "check": "String" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Sets the text of an existing GUI text block.",
                "helpUrl": ""
            },
            {
                "type": "gui_create_input_text",
                "message0": "create input field named %1",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myInput" }
                ],
                "message1": "align horizontal %1 vertical %2",
                "args1": [
                    {
                        "type": "field_dropdown", "name": "H_ALIGN",
                        "options": [["left", "0"], ["right", "1"], ["center", "2"]]
                    },
                    {
                        "type": "field_dropdown", "name": "V_ALIGN",
                        "options": [["top", "0"], ["bottom", "1"], ["center", "2"]]
                    }
                ],
                "message2": "at top %1 left %2",
                "args2": [
                    { "type": "input_value", "name": "TOP", "check": "String" },
                    { "type": "input_value", "name": "LEFT", "check": "String" }
                ],
                "inputsInline": false,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Creates a new input text field in the GUI with positioning.",
                "helpUrl": ""
            },
            {
                "type": "gui_get_input_text",
                "message0": "get text from input field %1",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myInput" }
                ],
                "output": "String",
                "colour": "#5B80A5",
                "tooltip": "Gets the text from a GUI input field.",
                "helpUrl": ""
            },
            {
                "type": "gui_create_button",
                "message0": "create button named %1 with text %2",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myButton" },
                    { "type": "input_value", "name": "TEXT", "check": "String" }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Creates a new button in the GUI.",
                "helpUrl": ""
            },
            {
                "type": "gui_create_image_from_url",
                "message0": "create image named %1 from URL %2",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myImage" },
                    { "type": "input_value", "name": "URL", "check": "String" }
                ],
                "inputsInline": true,
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Creates a new image in the GUI from a URL.",
                "helpUrl": ""
            },
            {
                "type": "gui_create_image_from_asset",
                "message0": "create image named %1 from asset %2",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myImage" },
                    { "type": "input_value", "name": "ASSET", "check": "String" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Creates a new image in the GUI from an asset.",
                "helpUrl": ""
            },
            {
                "type": "event_on_gui_click",
                "message0": "when GUI element %1 is clicked %2 do %3",
                "args0": [
                    { "type": "field_input", "name": "NAME", "text": "myButton" },
                    { "type": "input_dummy" },
                    { "type": "input_statement", "name": "DO" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "%{BKY_LOOPS_HUE}",
                "tooltip": "Executes code when the specified GUI element is clicked.",
                "helpUrl": ""
            },
            // Console Blocks
            {
                "type": "console_log",
                "message0": "console log %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "VALUE"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Logs a value to the browser console.",
                "helpUrl": ""
            },
            {
                "type": "console_warn",
                "message0": "console warn %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "VALUE"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#A5745B",
                "tooltip": "Logs a warning to the browser console.",
                "helpUrl": ""
            },
            {
                "type": "console_error",
                "message0": "console error %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "VALUE"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#A55B5B",
                "tooltip": "Logs an error to the browser console.",
                "helpUrl": ""
            },
            {
                "type": "console_clear",
                "message0": "console clear",
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#4C97FF",
                "tooltip": "Clears the browser console.",
                "helpUrl": ""
            },
            {
                "type": "parse_number_from",
                "message0": "parse number from %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "STRING",
                        "check": "String"
                    }
                ],
                "output": "Number",
                "colour": "%{BKY_MATH_HUE}",
                "tooltip": "Converts a string to a number.",
                "helpUrl": ""
            },
            {
                "type": "create_environment",
                "message0": "Create environment with skybox %1 ground %2",
                "args0": [
                    {
                        "type": "field_checkbox",
                        "name": "ENABLE_SKYBOX",
                        "checked": true
                    },
                    {
                        "type": "field_checkbox",
                        "name": "ENABLE_GROUND",
                        "checked": true
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 180,
                "tooltip": "Creates a skybox and ground for the scene.",
                "helpUrl": ""
            },
            {
                "type": "create_loading_screen",
                "message0": "create loading screen with text %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "TEXT",
                        "check": "String"
                    }
                ],
                "message1": "background color %1",
                "args1": [
                    {
                        "type": "field_colour",
                        "name": "BG_COLOR",
                        "colour": "#000000"
                    }
                ],
                "message2": "text color %1",
                "args2": [
                    {
                        "type": "field_colour",
                        "name": "TEXT_COLOR",
                        "colour": "#ffffff"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 180,
                "tooltip": "Creates a custom loading screen.",
            },
            {
                "type": "show_loading_screen",
                "message0": "show loading screen",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 180,
                "tooltip": "Shows the custom loading screen.",
            },
            {
                "type": "hide_loading_screen",
                "message0": "hide loading screen",
                "previousStatement": null,
                "nextStatement": null,
                "colour": 180,
                "tooltip": "Hides the custom loading screen.",
            },
            {
                "type": "set_background",
                "message0": "set background to %1",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "BACKGROUND"
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 180,
                "tooltip": "Sets the scene background to a color or procedural texture.",
                "helpUrl": ""
            },
            {
                "type": "procedural_texture",
                "message0": "procedural texture %1",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "TEXTURE",
                        "options": [
                            ["wood", "wood"],
                            ["marble", "marble"],
                            ["fire", "fire"],
                            ["road", "road"],
                            ["brick", "brick"],
                            ["grass", "grass"],
                            ["clouds", "clouds"]
                        ]
                    }
                ],
                "output": "String",
                "colour": 180,
                "tooltip": "Selects a procedural texture for the background.",
                "helpUrl": ""
            },
            {
                "type": "create_popup",
                "message0": "create popup with title %1",
                "args0": [
                    { "type": "input_value", "name": "TITLE", "check": "String" }
                ],
                "message1": "text %1 image URL %2",
                "args1": [
                    { "type": "input_value", "name": "TEXT", "check": "String" },
                    { "type": "input_value", "name": "IMAGE", "check": "String" }
                ],
                "message2": "button 1 name %1 text %2",
                "args2": [
                    { "type": "input_value", "name": "BUTTON1_NAME", "check": "String" },
                    { "type": "input_value", "name": "BUTTON1_TEXT", "check": "String" }
                ],
                "message3": "button 2 name %1 text %2",
                "args3": [
                    { "type": "input_value", "name": "BUTTON2_NAME", "check": "String" },
                    { "type": "input_value", "name": "BUTTON2_TEXT", "check": "String" }
                ],
                "output": "Rectangle",
                "colour": "#5B80A5",
                "tooltip": "Creates a popup with a title, an optional image, text, and up to two buttons.",
                "helpUrl": ""
            },
            {
                "type": "show_popup",
                "message0": "show popup %1",
                "args0": [
                    { "type": "input_value", "name": "NAME", "check": ["String", "Rectangle"] }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Shows the specified popup and pauses the game.",
                "helpUrl": ""
            },
            {
                "type": "hide_popup",
                "message0": "hide popup %1",
                "args0": [
                    { "type": "input_value", "name": "NAME", "check": ["String", "Rectangle"] }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Hides the specified popup and resumes the game.",
                "helpUrl": ""
            },
            {
                "type": "gui_set_popup_title",
                "message0": "in popup %1 set title to %2",
                "args0": [
                    { "type": "input_value", "name": "POPUP_NAME", "check": ["String", "Rectangle"] },
                    { "type": "input_value", "name": "TITLE", "check": "String" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Sets the title of an existing popup.",
                "helpUrl": ""
            },
            {
                "type": "gui_set_popup_image",
                "message0": "in popup %1 set image to URL %2",
                "args0": [
                    { "type": "input_value", "name": "POPUP_NAME", "check": ["String", "Rectangle"] },
                    { "type": "input_value", "name": "IMAGE_URL", "check": "String" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Sets the image of an existing popup from a URL.",
                "helpUrl": ""
            },
            {
                "type": "gui_set_popup_button_text",
                "message0": "in popup %1 set button %2 text to %3",
                "args0": [
                    { "type": "input_value", "name": "POPUP_NAME", "check": ["String", "Rectangle"] },
                    { "type": "input_value", "name": "BUTTON_NAME", "check": "String" },
                    { "type": "input_value", "name": "TEXT", "check": "String" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Sets the text of a button in an existing popup.",
                "helpUrl": ""
            },
            {
                "type": "gui_set_popup_text",
                "message0": "in popup %1 set text to %2",
                "args0": [
                    { "type": "input_value", "name": "POPUP_NAME", "check": "String" },
                    { "type": "input_value", "name": "TEXT", "check": "String" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#5B80A5",
                "tooltip": "Sets the main text of an existing popup.",
                "helpUrl": ""
            },
            {
                "type": "create_particles",
                "message0": "Create %1 particles on %2",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "TYPE",
                        "options": [["fire", "fire"], ["smoke", "smoke"], ["rain", "rain"]]
                    },
                    { "type": "input_value", "name": "TARGET" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160,
                "tooltip": "Creates a particle system on the specified object.",
                "helpUrl": ""
            },
            {
                "type": "set_fog",
                "message0": "set fog mode %1 color %2",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "MODE",
                        "options": [["none", "none"], ["exp", "exp"], ["exp2", "exp2"], ["linear", "linear"]]
                    },
                    { "type": "input_value", "name": "COLOR" }
                ],
                "message1": "density %1 start %2 end %3",
                "args1": [
                    { "type": "input_value", "name": "DENSITY", "check": "Number" },
                    { "type": "input_value", "name": "START", "check": "Number" },
                    { "type": "input_value", "name": "END", "check": "Number" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 180,
                "tooltip": "Sets the scene atmospheric fog.",
                "helpUrl": ""
            },
            {
                "type": "set_outline",
                "message0": "set outline on %1 width %2 color %3",
                "args0": [
                    { "type": "input_value", "name": "TARGET" },
                    { "type": "input_value", "name": "WIDTH", "check": "Number" },
                    { "type": "input_value", "name": "COLOR" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 210,
                "tooltip": "Enables an outline highlight on an object.",
                "helpUrl": ""
            },
            {
                "type": "create_advanced_light",
                "message0": "create %1 light named %2",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "TYPE",
                        "options": [["directional", "directional"], ["hemispheric", "hemispheric"], ["spot", "spot"], ["point", "point"]]
                    },
                    { "type": "field_input", "name": "NAME", "text": "light" }
                ],
                "message1": "position x %1 y %2 z %3",
                "args1": [
                    { "type": "input_value", "name": "X", "check": "Number" },
                    { "type": "input_value", "name": "Y", "check": "Number" },
                    { "type": "input_value", "name": "Z", "check": "Number" }
                ],
                "message2": "direction x %1 y %2 z %3",
                "args2": [
                    { "type": "input_value", "name": "DX", "check": "Number" },
                    { "type": "input_value", "name": "DY", "check": "Number" },
                    { "type": "input_value", "name": "DZ", "check": "Number" }
                ],
                "output": "Light",
                "colour": 65,
                "tooltip": "Creates an advanced light with position and direction.",
                "helpUrl": ""
            },
            {
                "type": "enable_shadows",
                "message0": "enable shadows for light %1 on %2",
                "args0": [
                    { "type": "input_value", "name": "LIGHT" },
                    { "type": "input_value", "name": "TARGETS" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 65,
                "tooltip": "Enables shadows for a light on specified objects.",
                "helpUrl": ""
            },
            {
                "type": "set_glow",
                "message0": "set glow enabled %1 intensity %2",
                "args0": [
                    { "type": "field_checkbox", "name": "ENABLED", "checked": true },
                    { "type": "input_value", "name": "INTENSITY", "check": "Number" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 180,
                "tooltip": "Enables or disables the glow effect for the whole scene.",
                "helpUrl": ""
            }
        ]);

        {
            javascript.javascriptGenerator.forBlock['create_particles'] = function (block, generator) {
                const type = block.getFieldValue('TYPE');
                const target = generator.valueToCode(block, 'TARGET', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.createParticleSystem(${target}, '${type}');\n`;
            };

            javascript.javascriptGenerator.forBlock['set_fog'] = function (block, generator) {
                const mode = block.getFieldValue('MODE');
                const color = generator.valueToCode(block, 'COLOR', generator.ORDER_ATOMIC) || "'#ffffff'";
                const density = generator.valueToCode(block, 'DENSITY', generator.ORDER_ATOMIC) || 0.1;
                const start = generator.valueToCode(block, 'START', generator.ORDER_ATOMIC) || 0;
                const end = generator.valueToCode(block, 'END', generator.ORDER_ATOMIC) || 100;
                return `sceneManager.setFog('${mode}', ${color}, ${density}, ${start}, ${end});\n`;
            };

            javascript.javascriptGenerator.forBlock['set_outline'] = function (block, generator) {
                const target = generator.valueToCode(block, 'TARGET', generator.ORDER_ATOMIC) || 'null';
                const width = generator.valueToCode(block, 'WIDTH', generator.ORDER_ATOMIC) || 0.1;
                const color = generator.valueToCode(block, 'COLOR', generator.ORDER_ATOMIC) || "'#ffffff'";
                return `sceneManager.setOutline(${target}, ${width}, ${color});\n`;
            };

            javascript.javascriptGenerator.forBlock['create_advanced_light'] = function (block, generator) {
                const type = block.getFieldValue('TYPE');
                const name = block.getFieldValue('NAME');
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 10;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                const dx = generator.valueToCode(block, 'DX', generator.ORDER_ATOMIC) || 0;
                const dy = generator.valueToCode(block, 'DY', generator.ORDER_ATOMIC) || -1;
                const dz = generator.valueToCode(block, 'DZ', generator.ORDER_ATOMIC) || 0;
                const code = `sceneManager.createAdvancedLight('${type}', '${name}', ${x}, ${y}, ${z}, ${dx}, ${dy}, ${dz})`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['enable_shadows'] = function (block, generator) {
                const light = generator.valueToCode(block, 'LIGHT', generator.ORDER_ATOMIC) || 'null';
                const targets = generator.valueToCode(block, 'TARGETS', generator.ORDER_ATOMIC) || '[]';
                return `sceneManager.enableShadows(${light}, ${targets});\n`;
            };

            javascript.javascriptGenerator.forBlock['set_glow'] = function (block, generator) {
                const enabled = block.getFieldValue('ENABLED') === 'TRUE';
                const intensity = generator.valueToCode(block, 'INTENSITY', generator.ORDER_ATOMIC) || 1;
                return `sceneManager.setGlow(${enabled}, ${intensity});\n`;
            };

            javascript.javascriptGenerator.forBlock['set_property'] = function (block, generator) {
                const property = generator.valueToCode(block, 'PROPERTY', generator.ORDER_ATOMIC) || "''";
                const target = generator.valueToCode(block, 'TARGET', generator.ORDER_ATOMIC) || 'null';
                const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.setProperty(${target}, ${property}, ${value});\n`;
            };

            javascript.javascriptGenerator.forBlock['create_popup'] = function (block, generator) {
                const title = generator.valueToCode(block, 'TITLE', generator.ORDER_ATOMIC) || "''";
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "''";
                const image = generator.valueToCode(block, 'IMAGE', generator.ORDER_ATOMIC) || "null";
                const button1Name = generator.valueToCode(block, 'BUTTON1_NAME', generator.ORDER_ATOMIC) || "''";
                const button1Text = generator.valueToCode(block, 'BUTTON1_TEXT', generator.ORDER_ATOMIC) || "''";
                const button2Name = generator.valueToCode(block, 'BUTTON2_NAME', generator.ORDER_ATOMIC) || "''";
                const button2Text = generator.valueToCode(block, 'BUTTON2_TEXT', generator.ORDER_ATOMIC) || "''";

                // Get the parent block, which should be a variables_set block
                const parentBlock = block.getParent();
                let variableName = 'myPopup'; // Default name
                if (parentBlock && parentBlock.type === 'variables_set') {
                    variableName = parentBlock.getVarModels()[0].name;
                }

                const options = `{
                    text: ${text},
                    image: ${image},
                    button1_name: ${button1Name} || \`\${'${variableName}'}_button1\`,
                    button1_text: ${button1Text},
                    button2_name: ${button2Name} || \`\${'${variableName}'}_button2\`,
                    button2_text: ${button2Text}
                }`;
                const code = `sceneManager.createPopup('${variableName}', ${title}, ${options})`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['show_popup'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.showPopup(${name});\n`;
            };

            javascript.javascriptGenerator.forBlock['hide_popup'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.hidePopup(${name});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_set_popup_title'] = function(block, generator) {
                const popupName = generator.valueToCode(block, 'POPUP_NAME', generator.ORDER_ATOMIC) || "''";
                const title = generator.valueToCode(block, 'TITLE', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.setPopupTitle(${popupName}, ${title});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_set_popup_image'] = function(block, generator) {
                const popupName = generator.valueToCode(block, 'POPUP_NAME', generator.ORDER_ATOMIC) || "''";
                const imageUrl = generator.valueToCode(block, 'IMAGE_URL', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.setPopupImage(${popupName}, ${imageUrl});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_set_popup_button_text'] = function(block, generator) {
                const popupName = generator.valueToCode(block, 'POPUP_NAME', generator.ORDER_ATOMIC) || "''";
                const buttonName = generator.valueToCode(block, 'BUTTON_NAME', generator.ORDER_ATOMIC) || "''";
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.setPopupButtonText(${popupName}, ${buttonName}, ${text});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_set_popup_text'] = function(block, generator) {
                const popupName = generator.valueToCode(block, 'POPUP_NAME', generator.ORDER_ATOMIC) || "''";
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.setPopupText(${popupName}, ${text});\n`;
            };


            javascript.javascriptGenerator.forBlock['show_loading_screen'] = function (block, generator) {
                return `
                    if (sceneManager.engine.loadingScreen) {
                        sceneManager.engine.displayLoadingUI();
                    } else {
                         console.warn("Show loading screen block used, but no loading screen was created. Please use the create loading screen block first.");
                    };
                `;
            };

            javascript.javascriptGenerator.forBlock['hide_loading_screen'] = function (block, generator) {
                return 'sceneManager.engine.hideLoadingUI();\n';
            };

            javascript.javascriptGenerator.forBlock['create_loading_screen'] = function (block, generator) {
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "'Loading...'";
                const bgColor = block.getFieldValue('BG_COLOR');
                const textColor = block.getFieldValue('TEXT_COLOR');
                return `
                    var loadingScreen = new CustomLoadingScreen(${text}, '${bgColor}', '${textColor}');
                    sceneManager.engine.loadingScreen = loadingScreen;
                `;
            };

            // --- Scripting Block Generators ---
            javascript.javascriptGenerator.forBlock['event_on_click'] = function (block, generator) {
                const objectName = generator.valueToCode(block, 'OBJECT_SELECTOR', generator.ORDER_ATOMIC) || 'null';
                const doCode = generator.statementToCode(block, 'DO_CODE');
                const callback = `function(thisMesh) {\n${doCode}\n}`;
                return `sceneManager.onClick(${objectName}, ${callback});\n`;
            };

            javascript.javascriptGenerator.forBlock['event_every_frame'] = function (block, generator) {
                const objectName = generator.valueToCode(block, 'OBJECT_SELECTOR', generator.ORDER_ATOMIC) || 'null';
                const doCode = generator.statementToCode(block, 'DO_CODE');
                const callback = `function(${objectName}) {\n${doCode}\n}`;
                return `sceneManager.everyFrame(${objectName}, ${callback});\n`;
            };

            javascript.javascriptGenerator.forBlock['action_rotate_continuously'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || null;
                const rotateXSpeed = generator.valueToCode(block, 'ROTATE_X_SPEED', generator.ORDER_ATOMIC) || 0;
                const rotateYSpeed = generator.valueToCode(block, 'ROTATE_Y_SPEED', generator.ORDER_ATOMIC) || 0;
                const rotateZSpeed = generator.valueToCode(block, 'ROTATE_Z_SPEED', generator.ORDER_ATOMIC) || 0;

                return `
if (${name}) {
    ${name}.rotation.x += (${rotateXSpeed} * (Math.PI / 180)) * (sceneManager.engine.getDeltaTime() / 1000);
    ${name}.rotation.y += (${rotateYSpeed} * (Math.PI / 180)) * (sceneManager.engine.getDeltaTime() / 1000);
    ${name}.rotation.z += (${rotateZSpeed} * (Math.PI / 180)) * (sceneManager.engine.getDeltaTime() / 1000);
}
`;
            };

            javascript.javascriptGenerator.forBlock['select_object'] = function (block, generator) {
                const objectName = block.getFieldValue('OBJECT_NAME');
                return [`'${objectName}'`, generator.ORDER_ATOMIC];
            };

            // --- Player and Camera Block Generators ---
            javascript.javascriptGenerator.forBlock['set_as_player'] = function (block, generator) {
                const objectName = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.setAsPlayer(${objectName});\n`;
            };

            javascript.javascriptGenerator.forBlock['camera_follow'] = function (block, generator) {
                const objectName = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.cameraFollow(${objectName});\n`;
            };

            javascript.javascriptGenerator.forBlock['camera_zoom'] = function (block, generator) {
                const zoomValue = generator.valueToCode(block, 'ZOOM', generator.ORDER_ATOMIC) || 0;
                return `sceneManager.cameraZoom(${zoomValue});\n`;
            };

            // --- Gameplay Block Generators ---
            javascript.javascriptGenerator.forBlock['on_collision'] = function (block, generator) {
                const obj1 = generator.valueToCode(block, 'OBJECT1', generator.ORDER_ATOMIC) || 'null';
                const obj2 = generator.valueToCode(block, 'OBJECT2', generator.ORDER_ATOMIC) || 'null';
                const doCode = generator.statementToCode(block, 'DO');

                // The 'collided_object' variable is made available within the 'DO' statement.
                // We need to ensure that the variable is properly declared and scoped.
                const collidedObjectVar = generator.nameDB_.getName('collided_object', Blockly.VARIABLE_CATEGORY_NAME);
                const callback = `async function(${collidedObjectVar}) {
                    // This function will be called with the collided object.
                    // We can then execute the DO code.
                    ${doCode}
                }`;
                // The generated code should call the onCollision method with the callback.
                return `sceneManager.onCollision(${obj1}, ${obj2}, ${callback});\n`;
            };

            javascript.javascriptGenerator.forBlock['destroy_object'] = function (block, generator) {
                const objectName = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.destroyObject(${objectName});\n`;
            };

            // --- Controller Block Generator ---
            javascript.javascriptGenerator.forBlock['on_button_press'] = function (block, generator) {
                const button = block.getFieldValue('BUTTON');
                const doCode = generator.statementToCode(block, 'DO');
                const callback = `function() {\n${doCode}\n}`;
                return `sceneManager.onButtonPress('${button}', ${callback});\n`;
            };

            javascript.javascriptGenerator.forBlock['get_joystick_direction'] = function (block, generator) {
                return ['sceneManager.joystick_state.angle', generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['get_joystick_force'] = function (block, generator) {
                return ['sceneManager.joystick_state.force', generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['player_jump'] = function (block, generator) {
                const force = generator.valueToCode(block, 'FORCE', generator.ORDER_ATOMIC) || '5';
                return `sceneManager.playerJump(${force});\n`;
            };

            javascript.javascriptGenerator.forBlock['player_move'] = function (block, generator) {
                const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '1';
                const direction = block.getFieldValue('DIRECTION');
                return `sceneManager.playerMove('${direction}', ${speed});\n`;
            };

            // --- Simplified JavaScript Generators ---
            javascript.javascriptGenerator.forBlock['position_model'] = function (block, generator) {
                const modelVar = generator.valueToCode(block, 'MODEL', generator.ORDER_ATOMIC) || 'null';
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || '0';
                return `sceneManager.move(${modelVar}, ${x}, ${y}, ${z});\n`;
            };

            javascript.javascriptGenerator.forBlock['create_camera'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                // This block is now mostly for semantic purpose, as camera is initialized.
                // We can consider removing it or making it switch between camera types.
                return `// Camera is managed by the sceneManager\n`;
            };

            javascript.javascriptGenerator.forBlock['point_camera_at_mesh'] = function (block, generator) {
                const meshVar = generator.nameDB_.getName(block.getFieldValue('MESH'), Blockly.Variables.NAME_TYPE);
                return `sceneManager.cameraFollow(${meshVar}.name);\n`;
            };

            javascript.javascriptGenerator.forBlock['import_3d_file_url'] = function (block, generator) {
                const modelUrl = block.getFieldValue('MODEL_URL');
                const posX = block.getFieldValue('POS_X');
                const posY = block.getFieldValue('POS_Y');
                const posZ = block.getFieldValue('POS_Z');
                const modelVarName = javascript.javascriptGenerator.nameDB_.getDistinctName(Blockly.utils.idGenerator.genUid(), Blockly.Variables.NameType);

                let code;
                const robloxMatch = modelUrl.match(/roblox\.com\/(?:users|users\/profile)\/(\d+)/i);
                if (robloxMatch) {
                    const userId = robloxMatch[1];
                    code = `await sceneManager.importRobloxAvatar('${modelVarName}', ${userId}, ${posX}, ${posY}, ${posZ})`;
                } else {
                    code = `await sceneManager.importModel('${modelVarName}', '${modelUrl}', ${posX}, ${posY}, ${posZ})`;
                }
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['set_isometric_camera'] = function (block, generator) {
                return `sceneManager.setIsometricCamera();\n`;
            };

            javascript.javascriptGenerator.forBlock['set_fps_camera'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.setFpsCamera(${object});\n`;
            };

            javascript.javascriptGenerator.forBlock['create_ground'] = function (block, generator) {
                const name = javascript.javascriptGenerator.nameDB_.getDistinctName(Blockly.utils.idGenerator.genUid(), Blockly.Variables.NameType);
                const width = generator.valueToCode(block, 'WIDTH', generator.ORDER_ATOMIC) || 10;
                const height = generator.valueToCode(block, 'HEIGHT', generator.ORDER_ATOMIC) || 10;
                const code = `sceneManager.createGround('${name}', ${width}, ${height});\n`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['set_ground_material'] = function (block, generator) {
                // This block is less relevant now, could be replaced with a generic color/texture block.
                return `// Material settings can be adjusted with changeColor or future texture blocks.\n`;
            };

            javascript.javascriptGenerator.forBlock['set_ground_physics'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                return `sceneManager.setGroundPhysics('${name}');\n`;
            };

            javascript.javascriptGenerator.forBlock['create_primitive'] = function (block, generator) {
                const type = block.getFieldValue('TYPE');
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || "'myObject'";
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;

                let code;
                if (type === 'sphere') {
                    code = `sceneManager.createSphere(${name}, ${x}, ${y}, ${z});\n`;
                } else if (type === 'cylinder') {
                    code = `sceneManager.createCylinder(${name}, ${x}, ${y}, ${z});\n`;
                } else {
                    code = `sceneManager.createBox(${name}, ${x}, ${y}, ${z});\n`;
                }
                return code;
            };

            javascript.javascriptGenerator.forBlock['create_box'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || "'myBox'";
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                const code = `sceneManager.createBox(${name}, ${x}, ${y}, ${z})`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['create_sphere'] = function (block, generator) {
                const name = javascript.javascriptGenerator.nameDB_.getDistinctName(Blockly.utils.idGenerator.genUid(), Blockly.Variables.NameType);
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                const code = `sceneManager.createSphere('${name}', ${x}, ${y}, ${z})`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['create_3d_text'] = function (block, generator) {
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "''";
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || "'myText'";
                const fontUrl = block.getFieldValue('FONT_URL');
                const code = `await sceneManager.createText(${name}, ${text}, '${fontUrl}')`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['scale_object'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 1;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 1;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 1;
                return `sceneManager.scale(${object}, ${x}, ${y}, ${z});\n`;
            };

            javascript.javascriptGenerator.forBlock['get_property'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const property = generator.valueToCode(block, 'PROPERTY', generator.ORDER_ATOMIC) || "''";
                const code = `sceneManager.getProperty(${object}, ${property})`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['set_metadata'] = function (block, generator) {
                const key = generator.valueToCode(block, 'KEY', generator.ORDER_ATOMIC) || "''";
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.setMetadata(${object}, ${key}, ${value});\n`;
            };

            javascript.javascriptGenerator.forBlock['get_metadata'] = function (block, generator) {
                const key = generator.valueToCode(block, 'KEY', generator.ORDER_ATOMIC) || "''";
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const code = `sceneManager.getMetadata(${object}, ${key})`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['move_object'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || 'null';
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                return `sceneManager.move(${name}, ${x}, ${y}, ${z});\n`;
            };

            javascript.javascriptGenerator.forBlock['create_light'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                return `sceneManager.createLight('${name}', ${x}, ${y}, ${z});\n`;
            };

            javascript.javascriptGenerator.forBlock['change_object_color'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || 'null';
                const color = generator.valueToCode(block, 'COLOR', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.changeColor(${name}, ${color});\n`;
            };

            javascript.javascriptGenerator.forBlock['rotate_object'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || 'null';
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                return `sceneManager.rotate(${name}, ${x}, ${y}, ${z});\n`;
            };

            javascript.javascriptGenerator.forBlock['create_keyframe'] = function (block, generator) {
                const frame = generator.valueToCode(block, 'FRAME', generator.ORDER_ATOMIC) || 0;
                const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || 0;
                const code = "{ frame: " + frame + ", value: " + value + " }";
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['animate_keyframes'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const property = block.getFieldValue('PROPERTY');
                const keyframes = generator.valueToCode(block, 'KEYFRAMES', generator.ORDER_ATOMIC) || '[]';
                const loop = block.getFieldValue('LOOP');

                let loopBool = false;
                let loopMode = 'CYCLE';

                if (loop === 'YES') {
                    loopBool = true;
                } else if (loop === 'PINGPONG') {
                    loopBool = true;
                    loopMode = 'PINGPONG';
                }

                return "sceneManager.animateKeyframes(" + object + ", '" + property + "', " + keyframes + ", " + loopBool + ", '" + loopMode + "');\n";
            };
            javascript.javascriptGenerator.forBlock['animate_object'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const property = block.getFieldValue('PROPERTY');
                const from = generator.valueToCode(block, 'FROM', generator.ORDER_ATOMIC) || 0;
                const to = generator.valueToCode(block, 'TO', generator.ORDER_ATOMIC) || 0;
                const duration = generator.valueToCode(block, 'DURATION', generator.ORDER_ATOMIC) || 1;
                const loop = block.getFieldValue('LOOP');

                let loopBool = false;
                let loopMode = 'CYCLE'; // Default string

                if (loop === 'YES') {
                    loopBool = true;
                } else if (loop === 'PINGPONG') {
                    loopBool = true;
                    loopMode = 'PINGPONG';
                }

                return `sceneManager.animateProperty(${object}, '${property}', ${from}, ${to}, ${duration}, ${loopBool}, '${loopMode}');\n`;
            };

            javascript.javascriptGenerator.forBlock['import_animation'] = function(block, generator) {
                const url = block.getFieldValue('URL');
                const varName = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
                return `var ${varName} = await sceneManager.importAnimation('${url}');\n`;
            };

            javascript.javascriptGenerator.forBlock['apply_animation'] = function(block, generator) {
                const anim = generator.valueToCode(block, 'ANIMATION', generator.ORDER_ATOMIC) || 'null';
                const model = generator.valueToCode(block, 'MODEL', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.applyAnimation(${anim}, ${model});\n`;
            };

            javascript.javascriptGenerator.forBlock['play_animation'] = function(block, generator) {
                const model = generator.valueToCode(block, 'MODEL', generator.ORDER_ATOMIC) || 'null';
                const from = generator.valueToCode(block, 'FROM', generator.ORDER_ATOMIC) || 0;
                const to = generator.valueToCode(block, 'TO', generator.ORDER_ATOMIC) || 100;
                const loop = block.getFieldValue('LOOP') === 'TRUE';
                return `sceneManager.playAnimation(${model}, ${from}, ${to}, ${loop});\n`;
            };

            javascript.javascriptGenerator.forBlock['stop_skeletal_animation'] = function(block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.stopSkeletalAnimation(${object});\n`;
            };

            javascript.javascriptGenerator.forBlock['stop_animation'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.stopPropertyAnimation(${object});\n`;
            };

            javascript.javascriptGenerator.forBlock['animate_rotation'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                const duration = generator.valueToCode(block, 'DURATION', generator.ORDER_ATOMIC) || 1;
                const loop = block.getFieldValue('LOOP');

                let loopBool = false;
                let loopMode = 'CYCLE';

                if (loop === 'YES') {
                    loopBool = true;
                } else if (loop === 'PINGPONG') {
                    loopBool = true;
                    loopMode = 'PINGPONG';
                }

                return `sceneManager.animateRotation(${object}, ${x}, ${y}, ${z}, ${duration}, ${loopBool}, '${loopMode}');\n`;
            };

            javascript.javascriptGenerator.forBlock['animate_position'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 0;
                const duration = generator.valueToCode(block, 'DURATION', generator.ORDER_ATOMIC) || 1;
                const loop = block.getFieldValue('LOOP');

                let loopBool = false;
                let loopMode = 'CYCLE';

                if (loop === 'YES') {
                    loopBool = true;
                } else if (loop === 'PINGPONG') {
                    loopBool = true;
                    loopMode = 'PINGPONG';
                }

                return `sceneManager.animatePosition(${object}, ${x}, ${y}, ${z}, ${duration}, ${loopBool}, '${loopMode}');\n`;
            };

            javascript.javascriptGenerator.forBlock['animate_scale'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 1;
                const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 1;
                const z = generator.valueToCode(block, 'Z', generator.ORDER_ATOMIC) || 1;
                const duration = generator.valueToCode(block, 'DURATION', generator.ORDER_ATOMIC) || 1;
                const loop = block.getFieldValue('LOOP');

                let loopBool = false;
                let loopMode = 'CYCLE';

                if (loop === 'YES') {
                    loopBool = true;
                } else if (loop === 'PINGPONG') {
                    loopBool = true;
                    loopMode = 'PINGPONG';
                }

                return `sceneManager.animateScale(${object}, ${x}, ${y}, ${z}, ${duration}, ${loopBool}, '${loopMode}');\n`;
            };

            javascript.javascriptGenerator.forBlock['enable_physics'] = function (block, generator) {
                const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || 'null';
                const mass = generator.valueToCode(block, 'MASS', generator.ORDER_ATOMIC) || 1;
                const impostorField = block.getFieldValue('IMPOSTOR');
                // Extract the type from the full BABYLON path
                const impostorType = impostorField.split('.').pop();
                return `sceneManager.enablePhysics(${name}, ${mass}, '${impostorType}');\n`;
            };

            javascript.javascriptGenerator.forBlock['apply_force'] = function (block, generator) {
                const target = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const fx = generator.valueToCode(block, 'FX', generator.ORDER_ATOMIC) || 0;
                const fy = generator.valueToCode(block, 'FY', generator.ORDER_ATOMIC) || 0;
                const fz = generator.valueToCode(block, 'FZ', generator.ORDER_ATOMIC) || 0;
                const px = generator.valueToCode(block, 'PX', generator.ORDER_ATOMIC) || 0;
                const py = generator.valueToCode(block, 'PY', generator.ORDER_ATOMIC) || 0;
                const pz = generator.valueToCode(block, 'PZ', generator.ORDER_ATOMIC) || 0;
                return `sceneManager.applyForce(${target}, ${fx}, ${fy}, ${fz}, ${px}, ${py}, ${pz});\n`;
            };

            javascript.javascriptGenerator.forBlock['apply_impulse'] = function (block, generator) {
                const target = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const fx = generator.valueToCode(block, 'FX', generator.ORDER_ATOMIC) || 0;
                const fy = generator.valueToCode(block, 'FY', generator.ORDER_ATOMIC) || 0;
                const fz = generator.valueToCode(block, 'FZ', generator.ORDER_ATOMIC) || 0;
                const px = generator.valueToCode(block, 'PX', generator.ORDER_ATOMIC) || 0;
                const py = generator.valueToCode(block, 'PY', generator.ORDER_ATOMIC) || 0;
                const pz = generator.valueToCode(block, 'PZ', generator.ORDER_ATOMIC) || 0;
                return `sceneManager.applyImpulse(${target}, ${fx}, ${fy}, ${fz}, ${px}, ${py}, ${pz});\n`;
            };

            javascript.javascriptGenerator.forBlock['get_object_pos'] = function (block, generator) {
                const axis = block.getFieldValue('AXIS');
                const target = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return [`sceneManager.getPos${axis}(${target})`, javascript.Order.FUNCTION_CALL];
            };

            javascript.javascriptGenerator.forBlock['get_collided_object'] = function (block, generator) {
                const collidedObjectVar = generator.nameDB_.getName('collided_object', Blockly.VARIABLE_CATEGORY_NAME);
                return [collidedObjectVar, javascript.Order.ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['set_gravity'] = function (block, generator) {
                const gx = generator.valueToCode(block, 'GX', generator.ORDER_ATOMIC) || 0;
                const gy = generator.valueToCode(block, 'GY', generator.ORDER_ATOMIC) || -9.81;
                const gz = generator.valueToCode(block, 'GZ', generator.ORDER_ATOMIC) || 0;
                return `sceneManager.setGravity(${gx}, ${gy}, ${gz});\n`;
            };

            javascript.javascriptGenerator.forBlock['set_physics_impostor'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const impostorField = block.getFieldValue('IMPOSTOR');
                // Extract the type from the full BABYLON path
                const impostorType = impostorField.split('.').pop();
                return `// Physics impostor is now set via enablePhysics. For '${name}', you can specify type.\n`;
            };

            // --- Audio Block Generators ---
            javascript.javascriptGenerator.forBlock['play_sound_url'] = function (block, generator) {
                const url = block.getFieldValue('URL');
                return `
                    sceneManager.playSound('${url}');
                `;
            };

            javascript.javascriptGenerator.forBlock['play_note'] = function (block, generator) {
                const note = block.getFieldValue('NOTE');
                const duration = generator.valueToCode(block, 'DURATION', generator.ORDER_ATOMIC) || '0.5';
                return `sceneManager.playNote(${note}, ${duration});\n`;
            };

            javascript.javascriptGenerator.forBlock['asset_model'] = function (block, generator) {
                const assetName = block.getFieldValue('ASSET');
                return [`'${assetName}'`, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['asset_audio'] = function (block, generator) {
                const assetName = block.getFieldValue('ASSET');
                return [`'${assetName}'`, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['asset_image'] = function (block, generator) {
                const assetName = block.getFieldValue('ASSET');
                return [`'${assetName}'`, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['import_model_from_asset'] = function (block, generator) {
                const assetName = generator.valueToCode(block, 'ASSET', generator.ORDER_ATOMIC) || 'null';
                const varName = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
                return `var ${varName} = await sceneManager.importModelAsset(${assetName}, assetManager);\n`;
            };

            javascript.javascriptGenerator.forBlock['play_sound_from_asset'] = function (block, generator) {
                const assetName = generator.valueToCode(block, 'ASSET', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.playSoundAsset(${assetName}, assetManager);\n`;
            };

            javascript.javascriptGenerator.forBlock['set_texture_from_asset'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const assetName = generator.valueToCode(block, 'ASSET', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.setTexture(${object}, ${assetName}, assetManager);\n`;
            };

            // --- GUI Block Generators ---
            javascript.javascriptGenerator.forBlock['gui_create_text_block'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "''";
                const hAlign = parseInt(block.getFieldValue('H_ALIGN'));
                const vAlign = parseInt(block.getFieldValue('V_ALIGN'));

                let top, left;
                const topBlock = block.getInputTargetBlock('TOP');
                if (topBlock && topBlock.type === 'text') {
                    top = `'${topBlock.getFieldValue('TEXT')}'`;
                } else {
                    top = generator.valueToCode(block, 'TOP', generator.ORDER_ATOMIC) || "'0px'";
                }

                const leftBlock = block.getInputTargetBlock('LEFT');
                if (leftBlock && leftBlock.type === 'text') {
                    left = `'${leftBlock.getFieldValue('TEXT')}'`;
                } else {
                    left = generator.valueToCode(block, 'LEFT', generator.ORDER_ATOMIC) || "'0px'";
                }

                const options = `{
                    horizontalAlignment: ${hAlign},
                    verticalAlignment: ${vAlign},
                    top: ${top},
                    left: ${left}
                }`;

                return `sceneManager.uiManager.createText('${name}', ${text}, ${options});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_set_text'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.uiManager.setText('${name}', ${text});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_create_input_text'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const hAlign = parseInt(block.getFieldValue('H_ALIGN'));
                const vAlign = parseInt(block.getFieldValue('V_ALIGN'));

                let top, left;
                const topBlock = block.getInputTargetBlock('TOP');
                if (topBlock && topBlock.type === 'text') {
                    top = `'${topBlock.getFieldValue('TEXT')}'`;
                } else {
                    top = generator.valueToCode(block, 'TOP', generator.ORDER_ATOMIC) || "'0px'";
                }

                const leftBlock = block.getInputTargetBlock('LEFT');
                if (leftBlock && leftBlock.type === 'text') {
                    left = `'${leftBlock.getFieldValue('TEXT')}'`;
                } else {
                    left = generator.valueToCode(block, 'LEFT', generator.ORDER_ATOMIC) || "'0px'";
                }

                const options = `{
                    horizontalAlignment: ${hAlign},
                    verticalAlignment: ${vAlign},
                    top: ${top},
                    left: ${left}
                }`;

                return `sceneManager.uiManager.createInput('${name}', ${options});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_get_input_text'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const code = `sceneManager.uiManager.getInputText('${name}')`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['gui_create_button'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.uiManager.createButton('${name}', ${text});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_create_image_from_url'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const url = generator.valueToCode(block, 'URL', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.uiManager.createImage('${name}', ${url});\n`;
            };

            javascript.javascriptGenerator.forBlock['gui_create_image_from_asset'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const assetName = generator.valueToCode(block, 'ASSET', generator.ORDER_ATOMIC) || "''";
                return `
                    (async () => {
                        const asset = await assetManager.getAsset(${assetName});
                        if (asset) {
                            sceneManager.uiManager.createImageFromAsset('${name}', asset);
                        }
                    })();
                `;
            };

            javascript.javascriptGenerator.forBlock['event_on_gui_click'] = function (block, generator) {
                const name = block.getFieldValue('NAME');
                const doCode = generator.statementToCode(block, 'DO');
                const callback = `function() {\n${doCode}\n}`;
                return `sceneManager.uiManager.onControlClick('${name}', ${callback});\n`;
            };

            // --- Console Block Generators ---
            javascript.javascriptGenerator.forBlock['console_log'] = function (block, generator) {
                const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || 'null';
                return `console.log(${value});\n`;
            };

            javascript.javascriptGenerator.forBlock['console_warn'] = function (block, generator) {
                const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || 'null';
                return `console.warn(${value});\n`;
            };

            javascript.javascriptGenerator.forBlock['console_error'] = function (block, generator) {
                const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || 'null';
                return `console.error(${value});\n`;
            };

            javascript.javascriptGenerator.forBlock['console_clear'] = function (block, generator) {
                return `console.clear();\n`;
            };

            javascript.javascriptGenerator.forBlock['take_screenshot'] = function (block, generator) {
                return `sceneManager.takeScreenshot();\n`;
            };

            javascript.javascriptGenerator.forBlock['set_pixelated_look'] = function (block, generator) {
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                return `sceneManager.setSamplingMode(${object}, 'nearest');\n`;
            };

            javascript.javascriptGenerator.forBlock['set_background_image'] = function (block, generator) {
                const url = generator.valueToCode(block, 'URL', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.setBackgroundImage(${url});\n`;
            };

            javascript.javascriptGenerator.forBlock['play_animation_by_index'] = function (block, generator) {
                const index = generator.valueToCode(block, 'INDEX', generator.ORDER_ATOMIC) || 0;
                const object = generator.valueToCode(block, 'OBJECT', generator.ORDER_ATOMIC) || 'null';
                const loop = block.getFieldValue('LOOP') === 'TRUE';
                return `sceneManager.playAnimationByIndex(${object}, ${index}, ${loop});\n`;
            };

            javascript.javascriptGenerator.forBlock['parse_number_from'] = function (block, generator) {
                const string = generator.valueToCode(block, 'STRING', generator.ORDER_ATOMIC) || "''";
                const code = `parseFloat(${string});\n`;
                return [code, generator.ORDER_ATOMIC];
            };

            javascript.javascriptGenerator.forBlock['create_environment'] = function (block, generator) {
                const enableSkybox = block.getFieldValue('ENABLE_SKYBOX') === 'TRUE';
                const enableGround = block.getFieldValue('ENABLE_GROUND') === 'TRUE';
                const options = {
                    createSkybox: enableSkybox,
                    createGround: enableGround
                };
                return `sceneManager.createEnvironment(${JSON.stringify(options)});\n`;
            };

            javascript.javascriptGenerator.forBlock['set_background'] = function (block, generator) {
                const background = generator.valueToCode(block, 'BACKGROUND', generator.ORDER_ATOMIC) || "''";
                return `sceneManager.setBackground(${background});\n`;
            };

            javascript.javascriptGenerator.forBlock['procedural_texture'] = function (block, generator) {
                const texture = block.getFieldValue('TEXTURE');
                return [`'${texture}'`, generator.ORDER_ATOMIC];
            };

            // Override the default function definition blocks to be async
            javascript.javascriptGenerator.forBlock['procedures_defnoreturn'] = function (block, generator) {
                const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
                let xfix1 = '';
                if (generator.STATEMENT_PREFIX) {
                    xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
                }
                if (generator.STATEMENT_SUFFIX) {
                    xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
                }
                if (xfix1) {
                    xfix1 = generator.prefixLines(xfix1, generator.INDENT);
                }
                let loopVar = '';
                if (block.hasStatements_) {
                    loopVar = generator.statementToCode(block, 'STACK');
                    if (generator.STATEMENT_SUFFIX) {
                        loopVar = generator.prefixLines(generator.injectId(generator.STATEMENT_SUFFIX, block), generator.INDENT) + loopVar;
                    }
                }
                let branch = loopVar;
                let args = [];
                const variables = block.getVars();
                for (let i = 0; i < variables.length; i++) {
                    args[i] = generator.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME);
                }
                let code = 'async function ' + funcName + '(' + args.join(', ') + ') {\n' + branch + '}';
                code = generator.scrub_(block, code);
                generator.definitions_['%' + funcName] = code;
                return null;
            };

            javascript.javascriptGenerator.forBlock['procedures_defreturn'] = function (block, generator) {
                const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
                let xfix1 = '';
                if (generator.STATEMENT_PREFIX) {
                    xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
                }
                if (generator.STATEMENT_SUFFIX) {
                    xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
                }
                if (xfix1) {
                    xfix1 = generator.prefixLines(xfix1, generator.INDENT);
                }
                let loopVar = '';
                if (block.hasStatements_) {
                    loopVar = generator.statementToCode(block, 'STACK');
                    if (generator.STATEMENT_SUFFIX) {
                        loopVar = generator.prefixLines(generator.injectId(generator.STATEMENT_SUFFIX, block), generator.INDENT) + loopVar;
                    }
                }
                let branch = loopVar;
                let returnValue = generator.valueToCode(block, 'RETURN', generator.ORDER_NONE) || '';
                let xfix2 = '';
                if (returnValue) {
                    returnValue = generator.INDENT + 'return ' + returnValue + ';\n';
                }
                let args = [];
                const variables = block.getVars();
                for (let i = 0; i < variables.length; i++) {
                    args[i] = generator.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME);
                }
                let code = 'async function ' + funcName + '(' + args.join(', ') + ') {\n' + branch + returnValue + '}';
                code = generator.scrub_(block, code);
                generator.definitions_['%' + funcName] = code;
                return null;
            };

            javascript.javascriptGenerator.forBlock['procedures_callreturn'] = function (block, generator) {
                const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
                const args = [];
                const variables = block.getVars();
                for (let i = 0; i < variables.length; i++) {
                    args[i] = generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE) || 'null';
                }
                const code = 'await ' + funcName + '(' + args.join(', ') + ')';
                return [code, generator.ORDER_FUNCTION_CALL];
            };

            javascript.javascriptGenerator.forBlock['procedures_callnoreturn'] = function (block, generator) {
                const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
                const args = [];
                const variables = block.getVars();
                for (let i = 0; i < variables.length; i++) {
                    args[i] = generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE) || 'null';
                }
                const code = 'await ' + funcName + '(' + args.join(', ') + ');\n';
                return code;
            };
        }

        // Convert Blockly Code to JavaScript

javascript.javascriptGenerator.forBlock['colour_random'] = function (block, generator) {
            return [generator.provideFunction_('colourRandom', `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
  var num = Math.floor(Math.random() * 0x1000000);
  return '#' + ('00000' + num.toString(16)).substr(-6);
}
`) + '()', generator.ORDER_FUNCTION_CALL];
        };
javascript.javascriptGenerator.forBlock['colour_picker'] = function (block, generator) {
            const colour = block.getFieldValue('COLOUR');
            return [`'${colour}'`, generator.ORDER_ATOMIC];
        };
}
