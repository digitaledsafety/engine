const { test, expect } = require('@playwright/test');

test.describe('Multiplayer PeerJS Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:4000/');

        // Wait for page load and dismissal of hero overlay
        const startBtn = page.locator('#start-button');
        if (await startBtn.isVisible()) {
            await startBtn.click();
        }

        // Mock PeerJS on window so tests do not rely on remote signaling servers
        await page.evaluate(() => {
            class MockDataConnection {
                constructor(remotePeerId) {
                    this.peer = remotePeerId;
                    this.open = true;
                    this.listeners = {};
                }
                on(event, cb) {
                    this.listeners[event] = cb;
                    if (event === 'open') {
                        setTimeout(() => cb(), 10);
                    }
                }
                send(data) {
                    if (this.remoteConn && this.remoteConn.listeners['data']) {
                        this.remoteConn.listeners['data'](data);
                    }
                }
                close() {
                    this.open = false;
                    if (this.listeners['close']) this.listeners['close']();
                    if (this.remoteConn && this.remoteConn.listeners['close']) {
                        this.remoteConn.listeners['close']();
                    }
                }
            }

            class MockPeer {
                constructor(id) {
                    this.id = id || 'mock-peer-' + Math.floor(Math.random() * 10000);
                    this.destroyed = false;
                    this.listeners = {};
                    setTimeout(() => {
                        if (this.listeners['open']) this.listeners['open'](this.id);
                    }, 10);
                }
                on(event, cb) {
                    this.listeners[event] = cb;
                }
                connect(remotePeerId) {
                    const conn1 = new MockDataConnection(remotePeerId);
                    const conn2 = new MockDataConnection(this.id);
                    conn1.remoteConn = conn2;
                    conn2.remoteConn = conn1;

                    if (window._mockPeerInstances && window._mockPeerInstances[remotePeerId]) {
                        const targetPeer = window._mockPeerInstances[remotePeerId];
                        setTimeout(() => {
                            if (targetPeer.listeners['connection']) {
                                targetPeer.listeners['connection'](conn2);
                            }
                        }, 20);
                    }
                    return conn1;
                }
                destroy() {
                    this.destroyed = true;
                }
            }

            window._mockPeerInstances = window._mockPeerInstances || {};
            window.Peer = function(id) {
                const instance = new MockPeer(id);
                window._mockPeerInstances[instance.id] = instance;
                return instance;
            };
        });
    });

    test('should host room and obtain local peer ID', async ({ page }) => {
        const peerId = await page.evaluate(async () => {
            const hostId = await window.sceneManager.hostRoom('test-room-123');
            return hostId;
        });

        expect(peerId).toBe('test-room-123');

        const currentId = await page.evaluate(() => window.sceneManager.getPeerId());
        expect(currentId).toBe('test-room-123');
    });

    test('should connect two peers and handle peer join/leave events and data transfer', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const events = [];

            // Peer 1 (Host)
            const hostScene = window.sceneManager;
            await hostScene.hostRoom('host-peer');
            hostScene.onPeerJoin((peerId) => events.push('join:' + peerId));
            hostScene.onPeerLeave((peerId) => events.push('leave:' + peerId));
            hostScene.onReceiveData((data, sender) => events.push('data:' + sender + ':' + JSON.stringify(data)));

            // Create a second scene manager instance for Client Peer
            const canvas2 = document.createElement('canvas');
            document.body.appendChild(canvas2);
            const clientScene = new BabylonSceneManager(canvas2);
            await clientScene.initPeer('client-peer');
            await clientScene.joinRoom('host-peer');

            // Wait for connection to open
            await new Promise(r => setTimeout(r, 100));

            // Client sends data to host
            clientScene.sendData({ greeting: 'Hello Host' });

            await new Promise(r => setTimeout(r, 100));

            // Clean up client
            clientScene.disconnectPeer();

            await new Promise(r => setTimeout(r, 100));

            return { events };
        });

        expect(result.events).toContain('join:client-peer');
        expect(result.events).toContain('data:client-peer:{"greeting":"Hello Host"}');
        expect(result.events).toContain('leave:client-peer');
    });

    test('should sync object transform across peers', async ({ page }) => {
        const syncedPosition = await page.evaluate(async () => {
            // Host creates mesh and syncs it
            const hostScene = window.sceneManager;
            await hostScene.hostRoom('host-sync');
            const box = hostScene.createBox('playerBox', 0, 0, 0);

            // Client creates scene and matching mesh
            const canvas2 = document.createElement('canvas');
            document.body.appendChild(canvas2);
            const clientScene = new BabylonSceneManager(canvas2);
            await clientScene.initPeer('client-sync');
            const clientBox = clientScene.createBox('playerBox', 0, 0, 0);

            await clientScene.joinRoom('host-sync');
            await new Promise(r => setTimeout(r, 100));

            // Host enables object sync
            hostScene.syncObject('playerBox', 50);

            // Host moves box
            box.position.set(10, 20, 30);

            // Wait for sync interval
            await new Promise(r => setTimeout(r, 150));

            const clientPos = {
                x: clientBox.position.x,
                y: clientBox.position.y,
                z: clientBox.position.z
            };

            clientScene.disconnectPeer();
            return clientPos;
        });

        expect(syncedPosition).toEqual({ x: 10, y: 20, z: 30 });
    });
});
