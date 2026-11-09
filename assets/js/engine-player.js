/**
 * <engine-player> Web Component
 *
 * Embeddable 3D Workspace Player with secure sandbox, aesthetic UI,
 * Fullscreen support, and developer-friendly attributes.
 *
 * Usage:
 * <script src="https://engine.digitaledsafety.github.io/assets/js/engine-player.js"></script>
 * <engine-player workspace="space-shooter" width="100%" height="500px"></engine-player>
 * or
 * <engine-player src="https://engine.digitaledsafety.github.io/workspaces/space-shooter/"></engine-player>
 */

(function () {
    'use strict';

    class EnginePlayer extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this._iframe = null;
        }

        static get observedAttributes() {
            return ['workspace', 'src', 'width', 'height', 'base-url', 'autoplay', 'allow-fullscreen'];
        }

        connectedCallback() {
            this.render();
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue !== newValue && this._iframe) {
                if (name === 'workspace' || name === 'src' || name === 'autoplay') {
                    this._updateSource();
                } else if (name === 'width' || name === 'height') {
                    this._updateDimensions();
                }
            }
        }

        _getBaseUrl() {
            if (this.hasAttribute('base-url')) {
                return this.getAttribute('base-url').replace(/\/+$/, '');
            }
            // Check if loaded from a known script source or default to location origin / relative
            const script = document.querySelector('script[src*="engine-player.js"]');
            if (script && script.src) {
                try {
                    const scriptUrl = new URL(script.src, window.location.href);
                    // Extract root path (e.g., origin or origin + path prefix before /assets/)
                    const pathname = scriptUrl.pathname;
                    const assetsIdx = pathname.indexOf('/assets/');
                    if (assetsIdx !== -1) {
                        return scriptUrl.origin + pathname.substring(0, assetsIdx);
                    }
                    return scriptUrl.origin;
                } catch (e) {
                    // Fallback to window origin
                }
            }
            return window.location.origin;
        }

        _computePlayerUrl() {
            const baseUrl = this._getBaseUrl();
            const src = this.getAttribute('src');
            const workspace = this.getAttribute('workspace');
            const autoplay = this.hasAttribute('autoplay');

            let url;
            if (src) {
                // If direct src provided, ensure it includes embed=1
                try {
                    url = new URL(src, window.location.href);
                } catch (e) {
                    url = new URL(src, baseUrl);
                }
            } else if (workspace) {
                // Determine workspace url
                const cleanWorkspace = workspace.replace(/^\/+|\/+$/g, '');
                url = new URL(`${baseUrl}/workspaces/${cleanWorkspace}/`);
            } else {
                url = new URL(`${baseUrl}/`);
            }

            url.searchParams.set('embed', '1');
            url.searchParams.set('mode', 'app');
            if (autoplay) {
                url.searchParams.set('autoplay', '1');
            }

            return url.toString();
        }

        _updateSource() {
            if (this._iframe) {
                this._iframe.src = this._computePlayerUrl();
            }
        }

        _updateDimensions() {
            const container = this.shadowRoot.querySelector('.player-wrapper');
            if (container) {
                const width = this.getAttribute('width');
                const height = this.getAttribute('height');
                if (width) container.style.width = width;
                if (height) container.style.height = height;
            }
        }

        render() {
            const width = this.getAttribute('width') || '100%';
            const height = this.getAttribute('height') || '450px';
            const allowFullscreen = !this.hasAttribute('allow-fullscreen') || this.getAttribute('allow-fullscreen') !== 'false';

            const playerUrl = this._computePlayerUrl();

            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                        box-sizing: border-box;
                        width: ${width};
                        height: ${height};
                        position: relative;
                        contain: layout style;
                    }
                    *, *::before, *::after {
                        box-sizing: border-box;
                    }
                    .player-wrapper {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        background: #000;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
                        display: flex;
                        flex-direction: column;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                        display: block;
                        background: transparent;
                        flex: 1;
                    }
                    .controls-bar {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        display: flex;
                        gap: 8px;
                        z-index: 10;
                        opacity: 0;
                        transition: opacity 0.25s ease;
                        pointer-events: none;
                    }
                    .player-wrapper:hover .controls-bar,
                    .player-wrapper:focus-within .controls-bar {
                        opacity: 1;
                        pointer-events: auto;
                    }
                    .btn-control {
                        background: rgba(18, 18, 18, 0.75);
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        color: #ffffff;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: background 0.2s, transform 0.1s;
                        text-decoration: none;
                    }
                    .btn-control:hover {
                        background: rgba(40, 40, 40, 0.9);
                        border-color: rgba(255, 255, 255, 0.4);
                        transform: translateY(-1px);
                    }
                    .btn-control:active {
                        transform: translateY(0);
                    }
                </style>
                <div class="player-wrapper">
                    <iframe
                        src="${playerUrl}"
                        allow="fullscreen; autoplay; accelerometer; gyroscope; xr-spatial-tracking; microphone; camera"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
                        allowfullscreen
                        loading="lazy"
                        title="3D Workspace Player"
                    ></iframe>
                    ${allowFullscreen ? `
                    <div class="controls-bar">
                        <button class="btn-control" id="fullscreen-btn" title="Toggle Fullscreen" aria-label="Toggle Fullscreen">
                            ⛶ Fullscreen
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;

            this._iframe = this.shadowRoot.querySelector('iframe');

            if (allowFullscreen) {
                const fsBtn = this.shadowRoot.getElementById('fullscreen-btn');
                if (fsBtn) {
                    fsBtn.addEventListener('click', () => {
                        this.requestFullscreenMode();
                    });
                }
            }
        }

        requestFullscreenMode() {
            const wrapper = this.shadowRoot.querySelector('.player-wrapper');
            if (!wrapper) return;

            if (!document.fullscreenElement) {
                if (wrapper.requestFullscreen) {
                    wrapper.requestFullscreen();
                } else if (wrapper.webkitRequestFullscreen) {
                    wrapper.webkitRequestFullscreen();
                } else if (wrapper.msRequestFullscreen) {
                    wrapper.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    }

    if (!customElements.get('engine-player')) {
        customElements.define('engine-player', EnginePlayer);
    }
})();
