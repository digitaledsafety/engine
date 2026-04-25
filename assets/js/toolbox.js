export const toolbox = {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: 'Logic',
                    categorystyle: 'logic_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'controls_if',
                        },
                        {
                            kind: 'block',
                            type: 'controls_if',
                            extraState: {
                                hasElse: 'true',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'controls_if',
                            extraState: {
                                hasElse: 'true',
                                elseIfCount: 1,
                            },
                        },
                        {
                            kind: 'block',
                            type: 'logic_compare',
                        },
                        {
                            kind: 'block',
                            type: 'logic_operation',
                        },
                        {
                            kind: 'block',
                            type: 'logic_negate',
                        },
                        {
                            kind: 'block',
                            type: 'logic_boolean',
                        },
                        {
                            kind: 'block',
                            type: 'logic_null',
                        },
                        {
                            kind: 'block',
                            type: 'logic_ternary',
                        },
                        {
                            kind: 'block',
                            type: 'controls_repeat_ext',
                            inputs: {
                                TIMES: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 10,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            kind: 'block',
                            type: 'controls_whileUntil',
                        },
                        {
                            kind: 'block',
                            type: 'controls_for',
                            fields: {
                                VAR: 'i',
                            },
                            inputs: {
                                FROM: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 1,
                                        },
                                    },
                                },
                                TO: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 10,
                                        },
                                    },
                                },
                                BY: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 1,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            kind: 'block',
                            type: 'controls_forEach',
                        },
                        {
                            kind: 'block',
                            type: 'controls_flow_statements',
                        },
                        {
                            kind: 'block',
                            type: 'select_object',
                        },
                        {
                            kind: 'block',
                            type: 'event_on_click',
                        },
                        {
                            kind: 'block',
                            type: 'event_every_frame',
                        },
                        {
                            kind: 'block',
                            type: 'action_rotate_continuously',
                        },
                    ],
                },
                {
                    kind: 'category',
                    name: 'GUI',
                    categorystyle: 'text_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'create_loading_screen',
                        },
                        {
                            kind: 'block',
                            type: 'show_loading_screen',
                        },
                        {
                            kind: 'block',
                            type: 'hide_loading_screen',
                        },
                        {
                            kind: 'block',
                            type: 'gui_create_text_block',
                        },
                        {
                            kind: 'block',
                            type: 'create_3d_text',
                        },
                        {
                            kind: 'block',
                            type: 'gui_set_text',
                        },
                        {
                            kind: 'block',
                            type: 'gui_create_input_text',
                        },
                        {
                            kind: 'block',
                            type: 'gui_get_input_text',
                        },
                        {
                            kind: 'block',
                            type: 'gui_create_button',
                        },
                        {
                            kind: 'block',
                            type: 'gui_create_image_from_url',
                        },
                        {
                            kind: 'block',
                            type: 'gui_create_image_from_asset',
                        },
                        {
                            kind: 'block',
                            type: 'event_on_gui_click',
                        },
                        {
                            kind: 'block',
                            type: 'create_popup',
                        },
                        {
                            kind: 'block',
                            type: 'show_popup',
                        },
                        {
                            kind: 'block',
                            type: 'hide_popup',
                        },
                        {
                            kind: 'block',
                            type: 'gui_set_popup_title',
                        },
                        {
                            kind: 'block',
                            type: 'gui_set_popup_image',
                        },
                        {
                            kind: 'block',
                            type: 'gui_set_popup_button_text',
                        },
                        {
                            kind: 'block',
                            type: 'gui_set_popup_text',
                        },
                        {
                            kind: 'block',
                            type: 'console_log',
                        },
                        {
                            kind: 'block',
                            type: 'console_warn',
                        },
                        {
                            kind: 'block',
                            type: 'console_error',
                        },
                        {
                            kind: 'block',
                            type: 'console_clear',
                        },
                        {
                            kind: 'block',
                            type: 'take_screenshot',
                        },
                    ]
                },

                {
                    kind: 'category',
                    name: 'Audio',
                    categorystyle: 'audio_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'play_sound_url',
                        },
                        {
                            kind: 'block',
                            type: 'play_note',
                        },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Game',
                    categorystyle: 'logic_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'set_as_player',
                        },
                        {
                            kind: 'block',
                            type: 'player_jump',
                        },
                        {
                            kind: 'block',
                            type: 'player_move',
                        },
                        {
                            kind: 'block',
                            type: 'enable_physics',
                        },
                        {
                            kind: 'block',
                            type: 'apply_force',
                        },
                        {
                            kind: 'block',
                            type: 'set_physics_impostor',
                        },
                        {
                            kind: 'block',
                            type: 'on_button_press',
                        },
                        {
                            kind: 'block',
                            type: 'get_joystick_direction',
                        },
                        {
                            kind: 'block',
                            type: 'get_joystick_force',
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Objects',
                    categorystyle: 'motion_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'import_3d_file_url',
                        },
                        {
                            kind: 'block',
                            type: 'on_collision',
                        },
                        {
                            kind: 'block',
                            type: 'destroy_object',
                        },
                        {
                            kind: 'block',
                            type: 'create_box',
                        },
                        {
                            kind: 'block',
                            type: 'create_sphere',
                        },
                        {
                            kind: 'block',
                            type: 'move_object',
                        },
                        {
                            kind: 'block',
                            type: 'change_object_color',
                        },
                        {
                            kind: 'block',
                            type: 'rotate_object',
                        },
                        {
                            "kind": "block",
                            "type": "position_model"
                        },
                        {
                            "kind": "block",
                            "type": "scale_object"
                        },
                        {
                            "kind": "block",
                            "type": "get_property"
                        },
                        {
                            "kind": "block",
                            "type": "set_metadata"
                        },
                        {
                            "kind": "block",
                            "type": "get_metadata"
                        },
                        {
                            kind: "block",
                            type: "animate_keyframes",
                        },
                        {
                            kind: "block",
                            type: "create_keyframe",
                        },
                        {
                            kind: 'block',
                            type: 'animate_object',
                        },
                        {
                            kind: 'block',
                            type: 'animate_rotation',
                        },
                        {
                            kind: 'block',
                            type: 'animate_position',
                        },
                        {
                            kind: 'block',
                            type: 'animate_scale',
                        },
                        {
                            "kind": "block",
                            "type": "import_animation"
                        },
                        {
                            "kind": "block",
                            "type": "apply_animation"
                        },
                        {
                            "kind": "block",
                            "type": "play_animation"
                        },
                        {
                            "kind": "block",
                            "type": "stop_skeletal_animation"
                        },
                        {
                            "kind": "block",
                            "type": "play_animation_by_index"
                        },
                        {
                            "kind": "block",
                            "type": "set_pixelated_look"
                        },
                        {
                            kind: 'block',
                            type: 'asset_model',
                        },
                        {
                            kind: 'block',
                            type: 'asset_audio',
                        },
                        {
                            kind: 'block',
                            type: 'asset_image',
                        },
                        {
                            kind: 'block',
                            type: 'import_model_from_asset',
                        },
                        {
                            kind: 'block',
                            type: 'play_sound_from_asset',
                        },
                        {
                            kind: 'block',
                            type: 'set_texture_from_asset',
                        }
                    ]
                },

                {
                    kind: 'category',
                    name: 'Scene',
                    categorystyle: 'scene_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'create_camera',
                        },
                        {
                            kind: 'block',
                            type: 'set_isometric_camera',
                        },
                        {
                            kind: 'block',
                            type: 'point_camera_at_mesh'
                        },
                        {
                            kind: 'block',
                            type: 'create_camera',
                        },
                        {
                            kind: 'block',
                            type: 'set_isometric_camera',
                        },
                        {
                            kind: 'block',
                            type: 'set_fps_camera',
                        },
                        {
                            kind: 'block',
                            type: 'camera_follow',
                        },
                        {
                            kind: 'block',
                            type: 'camera_zoom',
                        },
                        {
                            kind: 'block',
                            type: 'create_ground',
                        },
                        {
                            kind: 'block',
                            type: 'set_ground_material',
                        },
                        {
                            kind: 'block',
                            type: 'set_ground_physics',
                        },
                        {
                            kind: 'block',
                            type: 'create_light',
                        },
                        {
                            kind: 'block',
                            type: 'set_gravity',
                        },
                        {
                            kind: 'block',
                            type: 'create_environment',
                        },
                        {
                            kind: 'block',
                            type: 'set_background',
                        },
                        {
                            kind: 'block',
                            type: 'set_background_image',
                        },
                        {
                            kind: 'block',
                            type: 'procedural_texture'
                        },
                        {
                            kind: 'block',
                            type: 'colour_picker'
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Utils',
                    categorystyle: 'colour_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'colour_picker',
                        },
                        {
                            kind: 'block',
                            type: 'colour_random',
                        },
                        {
                            kind: 'block',
                            type: 'colour_rgb',
                        },
                        {
                            kind: 'block',
                            type: 'colour_blend',
                        },
                        {
                            kind: 'block',
                            type: 'math_number',
                            fields: {
                                NUM: 123,
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_arithmetic',
                            fields: {
                                OP: 'ADD',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_single',
                            fields: {
                                OP: 'ROOT',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_trig',
                            fields: {
                                OP: 'SIN',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_constant',
                            fields: {
                                CONSTANT: 'PI',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_number_property',
                            extraState: '<mutation divisor_input="false"></mutation>',
                            fields: {
                                PROPERTY: 'EVEN',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_round',
                            fields: {
                                OP: 'ROUND',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_on_list',
                            extraState: '<mutation op="SUM"></mutation>',
                            fields: {
                                OP: 'SUM',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_modulo',
                        },
                        {
                            kind: 'block',
                            type: 'math_constrain',
                            inputs: {
                                LOW: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 1,
                                        },
                                    },
                                },
                                HIGH: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 100,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_random_int',
                            inputs: {
                                FROM: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 1,
                                        },
                                    },
                                },
                                TO: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 100,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            kind: 'block',
                            type: 'math_random_float',
                        },
                        {
                            kind: 'block',
                            type: 'math_atan2',
                        },
                        {
                            kind: 'block',
                            type: 'parse_number_from',
                        },
                        {
                            kind: 'block',
                            type: 'text',
                        },
                        {
                            kind: 'block',
                            type: 'text_join',
                        },
                        {
                            kind: 'block',
                            type: 'text_append',
                        },
                        {
                            kind: 'block',
                            type: 'text_length',
                        },
                        {
                            kind: 'block',
                            type: 'text_isEmpty',
                        },
                        {
                            kind: 'block',
                            type: 'text_indexOf',
                        },
                        {
                            kind: 'block',
                            type: 'text_charAt',
                        },
                        {
                            kind: 'block',
                            type: 'text_getSubstring',
                        },
                        {
                            kind: 'block',
                            type: 'text_changeCase',
                        },
                        {
                            kind: 'block',
                            type: 'text_trim',
                        },
                        {
                            kind: 'block',
                            type: 'text_print',
                        },
                    ],
                },
                {
                    kind: 'category',
                    name: 'Lists',
                    categorystyle: 'list_category',
                    contents: [
                        {
                            kind: 'block',
                            type: 'lists_create_empty',
                        },
                        {
                            kind: 'block',
                            type: 'lists_create_with',
                            extraState: {
                                itemCount: 3,
                            },
                        },
                        {
                            kind: 'block',
                            type: 'lists_repeat',
                            inputs: {
                                NUM: {
                                    block: {
                                        type: 'math_number',
                                        fields: {
                                            NUM: 5,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            kind: 'block',
                            type: 'lists_length',
                        },
                        {
                            kind: 'block',
                            type: 'lists_isEmpty',
                        },
                        {
                            kind: 'block',
                            type: 'lists_indexOf',
                            fields: {
                                END: 'FIRST',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'lists_getIndex',
                            fields: {
                                MODE: 'GET',
                                WHERE: 'FROM_START',
                            },
                        },
                        {
                            kind: 'block',
                            type: 'lists_setIndex',
                            fields: {
                                MODE: 'SET',
                                WHERE: 'FROM_START',
                            },
                        },
                    ],
                },
                {
                    kind: 'category',
                    name: 'Variables',
                    categorystyle: 'variable_category',
                    custom: 'VARIABLE',
                },
                {
                    kind: 'category',
                    name: 'Functions',
                    categorystyle: 'procedure_category',
                    custom: 'PROCEDURE',
                },
                {
                    kind: 'category',
                    name: 'Library',
                    expanded: 'false',
                    contents: [
                        {
                            kind: 'category',
                            name: 'Randomize',
                            contents: [
                                {
                                    kind: 'block',
                                    type: 'procedures_defnoreturn',
                                    extraState: {
                                        params: [
                                            {
                                                name: 'list',
                                            },
                                        ],
                                    },
                                    icons: {
                                        comment: {
                                            text: 'Describe this function...',
                                            pinned: false,
                                            height: 80,
                                            width: 160,
                                        },
                                    },
                                    fields: {
                                        NAME: 'randomize',
                                    },
                                    inputs: {
                                        STACK: {
                                            block: {
                                                type: 'controls_for',
                                                fields: {
                                                    VAR: {
                                                        name: 'x',
                                                    },
                                                },
                                                inputs: {
                                                    FROM: {
                                                        block: {
                                                            type: 'math_number',
                                                            fields: {
                                                                NUM: 1,
                                                            },
                                                        },
                                                    },
                                                    TO: {
                                                        block: {
                                                            type: 'lists_length',
                                                            inline: false,
                                                            inputs: {
                                                                VALUE: {
                                                                    block: {
                                                                        type: 'variables_get',
                                                                        fields: {
                                                                            VAR: {
                                                                                name: 'list',
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    BY: {
                                                        block: {
                                                            type: 'math_number',
                                                            fields: {
                                                                NUM: 1,
                                                            },
                                                        },
                                                    },
                                                    DO: {
                                                        block: {
                                                            type: 'variables_set',
                                                            inline: false,
                                                            fields: {
                                                                VAR: {
                                                                    name: 'y',
                                                                },
                                                            },
                                                            inputs: {
                                                                VALUE: {
                                                                    block: {
                                                                        type: 'math_random_int',
                                                                        inputs: {
                                                                            FROM: {
                                                                                block: {
                                                                                    type: 'math_number',
                                                                                    fields: {
                                                                                        NUM: 1,
                                                                                    },
                                                                                },
                                                                            },
                                                                            TO: {
                                                                                block: {
                                                                                    type: 'lists_length',
                                                                                    inline: false,
                                                                                    inputs: {
                                                                                        VALUE: {
                                                                                            block: {
                                                                                                type: 'variables_get',
                                                                                                fields: {
                                                                                                    VAR: {
                                                                                                        name: 'list',
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                            next: {
                                                                block: {
                                                                    type: 'variables_set',
                                                                    inline: false,
                                                                    fields: {
                                                                        VAR: {
                                                                            name: 'temp',
                                                                        },
                                                                    },
                                                                    inputs: {
                                                                        VALUE: {
                                                                            block: {
                                                                                type: 'lists_getIndex',
                                                                                fields: {
                                                                                    MODE: 'GET',
                                                                                    WHERE: 'FROM_START',
                                                                                },
                                                                                inputs: {
                                                                                    VALUE: {
                                                                                        block: {
                                                                                            type: 'variables_get',
                                                                                            fields: {
                                                                                                VAR: {
                                                                                                    name: 'list',
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    AT: {
                                                                                        block: {
                                                                                            type: 'variables_get',
                                                                                            fields: {
                                                                                                VAR: {
                                                                                                    name: 'y',
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                    next: {
                                                                        block: {
                                                                            type: 'lists_setIndex',
                                                                            inline: false,
                                                                            fields: {
                                                                                MODE: 'SET',
                                                                                WHERE: 'FROM_START',
                                                                            },
                                                                            inputs: {
                                                                                LIST: {
                                                                                    block: {
                                                                                        type: 'variables_get',
                                                                                        fields: {
                                                                                            VAR: {
                                                                                                name: 'list',
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                                AT: {
                                                                                    block: {
                                                                                        type: 'variables_get',
                                                                                        fields: {
                                                                                            VAR: {
                                                                                                name: 'y',
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                                TO: {
                                                                                    block: {
                                                                                        type: 'lists_getIndex',
                                                                                        fields: {
                                                                                            MODE: 'GET',
                                                                                            WHERE: 'FROM_START',
                                                                                        },
                                                                                        inputs: {
                                                                                            VALUE: {
                                                                                                block: {
                                                                                                    type: 'variables_get',
                                                                                                    fields: {
                                                                                                        VAR: {
                                                                                                            name: 'list',
                                                                                                        },
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                            AT: {
                                                                                                block: {
                                                                                                    type: 'variables_get',
                                                                                                    fields: {
                                                                                                        VAR: {
                                                                                                            name: 'x',
                                                                                                        },
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                            next: {
                                                                                block: {
                                                                                    type: 'lists_setIndex',
                                                                                    inline: false,
                                                                                    fields: {
                                                                                        MODE: 'SET',
                                                                                        WHERE: 'FROM_START',
                                                                                    },
                                                                                    inputs: {
                                                                                        LIST: {
                                                                                            block: {
                                                                                                type: 'variables_get',
                                                                                                fields: {
                                                                                                    VAR: {
                                                                                                        name: 'list',
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                        AT: {
                                                                                            block: {
                                                                                                type: 'variables_get',
                                                                                                fields: {
                                                                                                    VAR: {
                                                                                                        name: 'x',
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                        TO: {
                                                                                            block: {
                                                                                                type: 'variables_get',
                                                                                                fields: {
                                                                                                    VAR: {
                                                                                                        name: 'temp',
                                                                                                    },
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                {
                                    kind: 'category',
                                    name: 'Jabberwocky',
                                    contents: [
                                        {
                                            kind: 'block',
                                            type: 'text_print',
                                            inputs: {
                                                TEXT: {
                                                    block: {
                                                        type: 'text',
                                                        fields: {
                                                            TEXT: "'Twas brillig, and the slithy toves",
                                                        },
                                                    },
                                                },
                                            },
                                            next: {
                                                block: {
                                                    type: 'text_print',
                                                    inputs: {
                                                        TEXT: {
                                                            block: {
                                                                type: 'text',
                                                                fields: {
                                                                    TEXT: '  Did gyre and gimble in the wabe:',
                                                                },
                                                            },
                                                        },
                                                    },
                                                    next: {
                                                        block: {
                                                            type: 'text_print',
                                                            inputs: {
                                                                TEXT: {
                                                                    block: {
                                                                        type: 'text',
                                                                        fields: {
                                                                            TEXT: 'All mimsy were the borogroves,',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                            next: {
                                                                block: {
                                                                    type: 'text_print',
                                                                    inputs: {
                                                                        TEXT: {
                                                                            block: {
                                                                                type: 'text',
                                                                                fields: {
                                                                                    TEXT: '  And the mome raths outgrabe.',
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            kind: 'block',
                                            type: 'text_print',
                                            inputs: {
                                                TEXT: {
                                                    block: {
                                                        type: 'text',
                                                        fields: {
                                                            TEXT: '"Beware the Jabberwock, my son!',
                                                        },
                                                    },
                                                },
                                            },
                                            next: {
                                                block: {
                                                    type: 'text_print',
                                                    inputs: {
                                                        TEXT: {
                                                            block: {
                                                                type: 'text',
                                                                fields: {
                                                                    TEXT: '  The jaws that bite, the claws that catch!',
                                                                },
                                                            },
                                                        },
                                                    },
                                                    next: {
                                                        block: {
                                                            type: 'text_print',
                                                            inputs: {
                                                                TEXT: {
                                                                    block: {
                                                                        type: 'text',
                                                                        fields: {
                                                                            TEXT: 'Beware the Jubjub bird, and shun',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                            next: {
                                                                block: {
                                                                    type: 'text_print',
                                                                    inputs: {
                                                                        TEXT: {
                                                                            block: {
                                                                                type: 'text',
                                                                                fields: {
                                                                                    TEXT: '  The frumious Bandersnatch!"',
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                }
            ]
        };
