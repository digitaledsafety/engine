import json
import base64

workspace = {
  "workspace": {
    "blocks": {
      "languageVersion": 0,
      "blocks": [
        {
          "type": "create_ground",
          "id": "ground1",
          "x": 10,
          "y": 10,
          "inputs": {
            "WIDTH": { "block": { "type": "math_number", "fields": { "NUM": 20 } } },
            "HEIGHT": { "block": { "type": "math_number", "fields": { "NUM": 20 } } }
          },
          "next": {
            "block": {
              "type": "variables_set",
              "fields": { "VAR": "myBox" },
              "inputs": {
                "VALUE": {
                  "block": {
                    "type": "create_box",
                    "inputs": {
                      "NAME": { "block": { "type": "text", "fields": { "TEXT": "box1" } } },
                      "X": { "block": { "type": "math_number", "fields": { "NUM": 0 } } },
                      "Y": { "block": { "type": "math_number", "fields": { "NUM": 1 } } },
                      "Z": { "block": { "type": "math_number", "fields": { "NUM": 0 } } }
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "change_object_color",
                  "inputs": {
                    "NAME": { "block": { "type": "variables_get", "fields": { "VAR": "myBox" } } },
                    "COLOR": { "block": { "type": "colour_picker", "fields": { "COLOUR": "#ff0000" } } }
                  },
                  "next": {
                    "block": {
                      "type": "variables_set",
                      "fields": { "VAR": "sun" },
                      "inputs": {
                        "VALUE": {
                          "block": {
                            "type": "create_advanced_light",
                            "fields": { "TYPE": "directional", "NAME": "sun" },
                            "inputs": {
                              "X": { "block": { "type": "math_number", "fields": { "NUM": 10 } } },
                              "Y": { "block": { "type": "math_number", "fields": { "NUM": 10 } } },
                              "Z": { "block": { "type": "math_number", "fields": { "NUM": 10 } } },
                              "DX": { "block": { "type": "math_number", "fields": { "NUM": -1 } } },
                              "DY": { "block": { "type": "math_number", "fields": { "NUM": -1 } } },
                              "DZ": { "block": { "type": "math_number", "fields": { "NUM": -1 } } }
                            }
                          }
                        }
                      },
                      "next": {
                        "block": {
                          "type": "enable_shadows",
                          "inputs": {
                            "LIGHT": { "block": { "type": "variables_get", "fields": { "VAR": "sun" } } },
                            "TARGETS": {
                              "block": {
                                "type": "lists_create_with",
                                "extraState": { "itemCount": 2 },
                                "inputs": {
                                  "ADD0": { "block": { "type": "variables_get", "fields": { "VAR": "myBox" } } },
                                  "ADD1": { "block": { "type": "select_object", "fields": { "OBJECT_NAME": "ground1" } } }
                                }
                              }
                            }
                          },
                          "next": {
                            "block": {
                              "type": "create_particles",
                              "fields": { "TYPE": "fire" },
                              "inputs": {
                                "TARGET": { "block": { "type": "variables_get", "fields": { "VAR": "myBox" } } }
                              },
                              "next": {
                                "block": {
                                  "type": "set_outline",
                                  "inputs": {
                                    "TARGET": { "block": { "type": "variables_get", "fields": { "VAR": "myBox" } } },
                                    "WIDTH": { "block": { "type": "math_number", "fields": { "NUM": 0.05 } } },
                                    "COLOR": { "block": { "type": "colour_picker", "fields": { "COLOUR": "#ffff00" } } }
                                  },
                                  "next": {
                                    "block": {
                                      "type": "set_fog",
                                      "fields": { "MODE": "linear" },
                                      "inputs": {
                                        "COLOR": { "block": { "type": "colour_picker", "fields": { "COLOUR": "#cccccc" } } },
                                        "DENSITY": { "block": { "type": "math_number", "fields": { "NUM": 0.1 } } },
                                        "START": { "block": { "type": "math_number", "fields": { "NUM": 20 } } },
                                        "END": { "block": { "type": "math_number", "fields": { "NUM": 50 } } }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  },
  "assets": [],
  "version": "1.0"
}

json_str = json.dumps(workspace)
print(base64.b64encode(json_str.encode()).decode())
