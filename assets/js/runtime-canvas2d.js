/**
 * Canvas 2D Engine Runtime Implementation.
 * Extends BaseRuntimeEngine to provide a lightweight 2D canvas rendering environment
 * with bundled Option 1 static registerBlocks for Blockly integration.
 */
(function (global) {
    'use strict';

    const BaseEngine = typeof BaseRuntimeEngine !== 'undefined' ? BaseRuntimeEngine : class {};

    class Canvas2DRuntimeEngine extends BaseEngine {
        /**
         * Bundled static method for registering 2D Canvas runtime Blockly blocks and generators.
         */
        static registerBlocks(Blockly, generator) {
            if (!Blockly || !Blockly.Blocks) return false;

            if (!Blockly.Blocks['canvas2d_draw_rect']) {
                Blockly.Blocks['canvas2d_draw_rect'] = {
                    init: function() {
                        this.appendValueInput("X").setCheck("Number").appendField("draw 2D rect X");
                        this.appendValueInput("Y").setCheck("Number").appendField("Y");
                        this.appendValueInput("WIDTH").setCheck("Number").appendField("width");
                        this.appendValueInput("HEIGHT").setCheck("Number").appendField("height");
                        this.appendValueInput("COLOR").setCheck("String").appendField("color");
                        this.setInputsInline(true);
                        this.setPreviousStatement(true, null);
                        this.setNextStatement(true, null);
                        this.setStyle("scene_blocks");
                        this.setTooltip("Draws a colored rectangle on 2D canvas");
                    }
                };
            }

            if (!Blockly.Blocks['canvas2d_clear']) {
                Blockly.Blocks['canvas2d_clear'] = {
                    init: function() {
                        this.appendDummyInput().appendField("clear 2D canvas");
                        this.setPreviousStatement(true, null);
                        this.setNextStatement(true, null);
                        this.setStyle("scene_blocks");
                        this.setTooltip("Clears the entire 2D canvas viewport");
                    }
                };
            }

            if (generator && generator.forBlock) {
                if (!generator.forBlock['canvas2d_draw_rect']) {
                    generator.forBlock['canvas2d_draw_rect'] = function(block, gen) {
                        const x = gen.valueToCode(block, 'X', gen.ORDER_ATOMIC) || '0';
                        const y = gen.valueToCode(block, 'Y', gen.ORDER_ATOMIC) || '0';
                        const w = gen.valueToCode(block, 'WIDTH', gen.ORDER_ATOMIC) || '100';
                        const h = gen.valueToCode(block, 'HEIGHT', gen.ORDER_ATOMIC) || '100';
                        const c = gen.valueToCode(block, 'COLOR', gen.ORDER_ATOMIC) || '"#FF0000"';
                        return `if (window.sceneManager && window.sceneManager.drawRect) { window.sceneManager.drawRect(${x}, ${y}, ${w}, ${h}, ${c}); }\n`;
                    };
                }

                if (!generator.forBlock['canvas2d_clear']) {
                    generator.forBlock['canvas2d_clear'] = function() {
                        return `if (window.sceneManager && window.sceneManager.clearCanvas) { window.sceneManager.clearCanvas(); }\n`;
                    };
                }
            }
            return true;
        }

        constructor(canvas, options = {}) {
            super(canvas, options);
            this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
            this.ctx = this.canvas && this.canvas.getContext ? this.canvas.getContext('2d') : null;
            this.drawCommands = [];
        }

        async init() {
            if (super.init) await super.init();
            this.clearCanvas();
        }

        clearCanvas() {
            if (this.ctx && this.canvas) {
                this.ctx.clearRect(0, 0, this.canvas.width || 800, this.canvas.height || 600);
            }
            this.drawCommands = [];
        }

        drawRect(x, y, width, height, color = '#FF0000') {
            if (this.ctx) {
                this.ctx.fillStyle = color;
                this.ctx.fillRect(Number(x) || 0, Number(y) || 0, Number(width) || 100, Number(height) || 100);
            }
            this.drawCommands.push({ type: 'rect', x, y, width, height, color });
        }

        createPrimitive(type, options = {}) {
            if (type === 'rect') {
                this.drawRect(options.x || 0, options.y || 0, options.width || 100, options.height || 100, options.color || '#FF0000');
            }
            return { type, ...options };
        }

        destroyObject(target) {
            this.clearCanvas();
        }
    }

    if (typeof global.EngineRuntime !== 'undefined' && global.EngineRuntime.register) {
        global.EngineRuntime.register('canvas2d', Canvas2DRuntimeEngine);
        global.EngineRuntime.register('2d', Canvas2DRuntimeEngine);
    }

    global.Canvas2DRuntimeEngine = Canvas2DRuntimeEngine;
})(typeof window !== 'undefined' ? window : this);
