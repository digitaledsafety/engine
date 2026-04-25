import re
import os

with open('_layouts/default.html', 'r') as f:
    content = f.read()

# 1. Nomenclature
content = content.replace('title="Save">💾 Save', 'title="Export Project">💾 Export Project')
content = content.replace('title="Load">📂 Load', 'title="Import Project">📂 Import Project')
content = content.replace('title="Share">🔗 Share', 'title="Share & Embed">🔗 Share & Embed')

# 2. Modal HTML
modal_html = """
    <!-- Share & Embed Modal -->
    <div id="shareModal" style="display:none; position:fixed; z-index:4001; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.7); justify-content:center; align-items:center;">
        <div style="background:#fff; padding:20px; border-radius:8px; width:90%; max-width:500px; color:#333;">
            <h2 style="margin-top:0;">Share & Embed</h2>
            <div id="shareLinks" style="display:none;">
                <p>Embed this workspace in your own site:</p>
                <label style="display:block; margin-bottom:5px; font-weight:bold;">Workspace URL:</label>
                <input type="text" id="shareUrl" readonly style="width:100%; padding:8px; margin-bottom:15px; border:1px solid #ccc; border-radius:4px;">
                <label style="display:block; margin-bottom:5px; font-weight:bold;">Embed Code:</label>
                <textarea id="embedCode" readonly style="width:100%; height:80px; padding:8px; margin-bottom:15px; border:1px solid #ccc; border-radius:4px; font-family:monospace; font-size:12px;"></textarea>
            </div>
            <div id="publishMessage"><p>To embed this workspace, you must first <strong>Publish</strong> it and get a URL.</p></div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button id="nativeShareBtn" class="btn" style="background:#6c757d;">Share File</button>
                <button id="closeShareBtn" class="btn" style="background:#007bff;">Close</button>
            </div>
        </div>
    </div>
"""
if 'id="shareModal"' not in content:
    content = content.replace('</body>', modal_html + '</body>')

# 3. Module Scripts
new_script = """<script type="module">
        import { CustomLoadingScreen, AssetManager, BabylonSceneManager, UIManager, isValidAssetURL } from '{{ site.baseurl }}/assets/js/engine-core.js';
        import { ProjectManager } from '{{ site.baseurl }}/assets/js/project-manager.js';
        import { toolbox as mainToolbox } from '{{ site.baseurl }}/assets/js/toolbox.js';
        import { registerBlocks } from '{{ site.baseurl }}/assets/js/blocks.js';

        window.CustomLoadingScreen = CustomLoadingScreen; window.AssetManager = AssetManager; window.BabylonSceneManager = BabylonSceneManager;
        window.UIManager = UIManager; window.isValidAssetURL = isValidAssetURL; window.ProjectManager = ProjectManager;
        window.mainToolbox = mainToolbox; window.registerBlocks = registerBlocks;

        const assetManager = new AssetManager(); window.assetManager = assetManager;

        function getModelAssets() { const opts = assetManager.assets.filter(a => a.type.startsWith('model/') || a.name.endsWith('.glb') || a.name.endsWith('.gltf')).map(a => [a.name, a.name]); return opts.length > 0 ? opts : [['none', 'NONE']]; }
        function getAudioAssets() { const opts = assetManager.assets.filter(a => a.type.startsWith('audio/')).map(a => [a.name, a.name]); return opts.length > 0 ? opts : [['none', 'NONE']]; }
        function getImageAssets() { const opts = assetManager.assets.filter(a => a.type.startsWith('image/')).map(a => [a.name, a.name]); return opts.length > 0 ? opts : [['none', 'NONE']]; }
        window.getModelAssets = getModelAssets; window.getAudioAssets = getAudioAssets; window.getImageAssets = getImageAssets;

        document.addEventListener('DOMContentLoaded', () => {
            const heroOverlay = document.getElementById('hero-overlay');
            const startButton = document.getElementById('start-button');
            if (heroOverlay && startButton) {
                startButton.addEventListener('click', () => {
                    if (window.sceneManager && window.sceneManager.audioContext && window.sceneManager.audioContext.state === 'suspended') { window.sceneManager.audioContext.resume(); }
                    if (document.body.classList.contains('presentation-mode')) { if (typeof enterPresentationMode === 'function') enterPresentationMode(); }
                    heroOverlay.classList.add('hidden');
                    setTimeout(() => { heroOverlay.style.display = 'none'; }, 500);
                });
            }
        });

        registerBlocks(Blockly, { getModelAssets, getAudioAssets, getImageAssets });

        async function doRun(code) {
            let codeToRun = code || javascript.javascriptGenerator.workspaceToCode(workspace);
            if (window.sceneManager) { window.sceneManager.dispose(); }
            const canvas = document.getElementById('gameCanvas');
            window.sceneManager = new BabylonSceneManager(canvas, { container: document.body });
            try {
                const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                const userGeneratedCode = new AsyncFunction('sceneManager', 'assetManager', codeToRun);
                await userGeneratedCode(window.sceneManager, window.assetManager);
            } catch (error) { console.error('Error executing code:', error); }
            finally { console.log("JULES_VERIFICATION: SCENE_READY"); }
        }
        window.doRun = doRun;

        const helper = function () { if (this.getField('MODEL_URL')) this.getField('MODEL_URL').maxDisplayLength = 16; }
        Blockly.Extensions.register('set_max_display_length', helper);

        const canvas = document.getElementById('gameCanvas');
        const workspace = Blockly.inject('blocklyDiv', {
            toolbox: mainToolbox, theme: Blockly.Themes.DigitalEducationSafety, undoStack: true, redoStack: true, renderer: 'zelos', horizontalLayout: true, toolboxPosition: 'end',
            zoom: { controls: true, wheel: true, startScale: 0.8, maxScale: 3, minScale: 0, scaleSpeed: 1.2, pinch: true }, trashcan: true
        });
        window.workspace = workspace;
        window.sceneManager = new BabylonSceneManager(canvas, { container: document.body });
        const projectManager = new ProjectManager(assetManager, workspace, window.sceneManager);
        window.projectManager = projectManager;

        assetManager.init().then(() => { loadAssetsIntoView(); }).catch(e => console.error(e));

        const assetUploader = document.getElementById('asset-uploader');
        if (assetUploader) {
            assetUploader.addEventListener('change', async (event) => {
                for (const file of event.target.files) { await assetManager.addAsset(file); }
                loadAssetsIntoView();
            });
        }

        const addAssetBtn = document.getElementById('add-asset-from-url-button');
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', async () => {
                const url = document.getElementById('asset-url-input').value;
                if (!url) return;
                try { await assetManager.addAssetFromURL(url); loadAssetsIntoView(); document.getElementById('asset-url-input').value = ''; }
                catch (e) { console.error(e); }
            });
        }

        async function loadAssetsIntoView() {
            const assetList = document.getElementById('asset-list');
            if (!assetList) return;
            assetList.innerHTML = '';
            const assets = await assetManager.getAllAssets();
            assets.forEach(asset => {
                const li = document.createElement('li');
                li.textContent = asset.name;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = async () => { await assetManager.deleteAsset(asset.name); loadAssetsIntoView(); };
                li.appendChild(deleteButton);
                assetList.appendChild(li);
            });
        }

        const menuBtn = document.getElementById('menuButton');
        if (menuBtn) menuBtn.addEventListener('click', () => document.getElementById('dropdownMenu').classList.toggle('show'));
        window.addEventListener('click', (e) => { if (!e.target.matches('.btn-menu-toggle')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) { if (dropdowns[i].classList.contains('show')) dropdowns[i].classList.remove('show'); }
        }});
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (dropdownMenu) dropdownMenu.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') dropdownMenu.classList.remove('show'); });

        if (document.getElementById('runButton')) document.getElementById('runButton').addEventListener('click', () => doRun());
        if (document.getElementById('saveButton')) document.getElementById('saveButton').addEventListener('click', () => projectManager.saveProject());
        if (document.getElementById('publishButton')) document.getElementById('publishButton').addEventListener('click', () => projectManager.publishProject());
        if (document.getElementById('loadButton')) document.getElementById('loadButton').addEventListener('click', () => projectManager.loadProject());
        if (document.getElementById('docsButton')) document.getElementById('docsButton').addEventListener('click', () => window.open('docs/Home.html', '_blank'));
        if (document.getElementById('screenshotButton')) document.getElementById('screenshotButton').addEventListener('click', () => window.sceneManager.takeScreenshot());

        const searchContainer = document.getElementById('search-container');
        const searchInput = document.getElementById('search-input');
        const toggleToolboxBtn = document.getElementById('toggleToolboxButton');
        if (toggleToolboxBtn) {
            toggleToolboxBtn.addEventListener('click', () => {
                const blocklyDiv = document.getElementById('blocklyDiv');
                const isVisible = !blocklyDiv.classList.contains('toolbox-collapsed');
                if (!isVisible) { blocklyDiv.classList.remove('toolbox-collapsed'); searchContainer.classList.add('show'); searchInput.focus(); }
                else { blocklyDiv.classList.add('toolbox-collapsed'); searchContainer.classList.remove('show'); searchInput.value = ''; filterToolbox(''); }
                Blockly.svgResize(workspace);
            });
        }
        if (searchInput) searchInput.addEventListener('input', (e) => filterToolbox(e.target.value));

        function filterToolbox(searchTerm) {
            searchTerm = searchTerm.toLowerCase().trim();
            if (!searchTerm) { workspace.updateToolbox(mainToolbox); return; }
            const results = [];
            const findBlocks = (contents) => {
                for (const item of contents) {
                    if (item.kind === 'category') findBlocks(item.contents || []);
                    else if (item.kind === 'block' && item.type.toLowerCase().includes(searchTerm.replace(/ /g, '_'))) results.push(item);
                }
            };
            findBlocks(mainToolbox.contents);
            const uniqueResults = []; const seen = new Set();
            for (const r of results) { if (!seen.has(r.type)) { uniqueResults.push(r); seen.add(r.type); } }
            workspace.updateToolbox({ kind: 'categoryToolbox', contents: [{ kind: 'category', name: 'Search Results', categorystyle: 'search_category', contents: uniqueResults }, ...mainToolbox.contents] });
            const tb = workspace.getToolbox(); if (tb) tb.selectItemByPosition(0);
        }

        if (document.getElementById('undoButton')) document.getElementById('undoButton').addEventListener('click', () => workspace.undo(false));
        if (document.getElementById('redoButton')) document.getElementById('redoButton').addEventListener('click', () => workspace.undo(true));
        workspace.addChangeListener(() => {
            const undoBtn = document.getElementById('undoButton');
            const redoBtn = document.getElementById('redoButton');
            if (undoBtn) undoBtn.disabled = workspace.getUndoStack().length === 0;
            if (redoBtn) redoBtn.disabled = workspace.getRedoStack().length === 0;
        });

        const fsBtn = document.getElementById('fullscreenBtn');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                const cc = document.querySelector('.canvas-container');
                if (!document.fullscreenElement) { if (cc.requestFullscreen) cc.requestFullscreen(); }
                else { if (document.exitFullscreen) document.exitFullscreen(); }
            });
        }

        const toggleFS = () => { document.body.classList.toggle('fullscreen-active', !!document.fullscreenElement); resizeCanvas(); };
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(e => document.addEventListener(e, toggleFS));

        window.addEventListener('resize', resizeCanvas);
        function resizeCanvas() {
            const container = document.querySelector('.canvas-container');
            const canvas = document.getElementById('gameCanvas');
            if (!container || !canvas) return;
            canvas.width = container.offsetWidth; canvas.height = container.offsetHeight;
            if (window.sceneManager?.engine) {
                window.sceneManager.engine.resize();
                window.sceneManager.uiManager.advancedTexture.scaleTo(window.sceneManager.engine.getRenderWidth(), window.sceneManager.engine.getRenderHeight());
                window.sceneManager.uiManager.advancedTexture.markAsDirty();
            }
            if (window.sceneManager?.scene?.activeCamera?.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
                const cam = window.sceneManager.scene.activeCamera; const aspect = canvas.width / canvas.height; const size = 10;
                cam.orthoLeft = -size * aspect; cam.orthoRight = size * aspect; cam.orthoBottom = -size; cam.orthoTop = size;
            }
        }
        resizeCanvas();

        const codeViewButton = document.getElementById('codeViewButton');
        const assetsViewButton = document.getElementById('assetsViewButton');
        const codeView = document.getElementById('code-view');
        const assetsView = document.getElementById('assets-view');
        function showView(view) {
            if (!codeView || !assetsView) return;
            codeView.style.display = assetsView.style.display = 'none';
            if (codeViewButton) codeViewButton.classList.remove('active');
            if (assetsViewButton) assetsViewButton.classList.remove('active');
            if (view === 'code') { codeView.style.display = 'flex'; if (codeViewButton) codeViewButton.classList.add('active'); }
            else if (view === 'assets') { assetsView.style.display = 'flex'; if (assetsViewButton) assetsViewButton.classList.add('active'); }
        }
        if (codeViewButton) codeViewButton.addEventListener('click', () => showView('code'));
        if (assetsViewButton) assetsViewButton.addEventListener('click', () => showView('assets'));
        showView('code');

        const touchJump = document.getElementById('touch-jump');
        const handleTouch = (key, pressed) => { if (window.sceneManager) window.sceneManager.inputState.keys[key] = pressed; };
        if (touchJump) {
            touchJump.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouch(' ', true); }, { passive: false });
            touchJump.addEventListener('touchend', (e) => { e.preventDefault(); handleTouch(' ', false); }, { passive: false });
            touchJump.addEventListener('touchcancel', (e) => { e.preventDefault(); handleTouch(' ', false); }, { passive: false });
        }

        async function loadProjectFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const projectParam = urlParams.get('project');
            const workspaceDataEl = document.getElementById('workspace-data');
            if (urlParams.has('fullscreen')) enterPresentationMode();
            try {
                let data;
                if (workspaceDataEl?.textContent.trim()) data = JSON.parse(atob(workspaceDataEl.textContent.trim()));
                else if (projectParam) data = JSON.parse(atob(projectParam));
                if (data) await projectManager.loadProjectData(data.workspace ? data : { workspace: data, assets: [], version: '0.9' });
                else loadWorkspaceDefault();
            } catch (e) { console.error(e); loadWorkspaceDefault(); }
        }
        function loadWorkspaceDefault() { window.doRun(); }
        function enterPresentationMode() {
            document.body.classList.add('presentation-mode');
            const cc = document.querySelector('.canvas-container');
            if (cc) { setTimeout(resizeCanvas, 100); if (cc.requestFullscreen) cc.requestFullscreen(); }
        }
        window.enterPresentationMode = enterPresentationMode;
        loadProjectFromUrl();

        const shareModal = document.getElementById('shareModal');
        const shareUrlInput = document.getElementById('shareUrl');
        const embedCodeInput = document.getElementById('embedCode');
        const shareLinksDiv = document.getElementById('shareLinks');
        const publishMessage = document.getElementById('publishMessage');
        const shareBtn = document.getElementById('shareButton');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const currentUrl = window.location.href;
                if (currentUrl.includes('/workspaces/')) {
                    shareUrlInput.value = currentUrl;
                    embedCodeInput.value = `<script type="module" src="${window.location.origin}${window.location.pathname.startsWith('/engine') ? '/engine' : ''}/assets/js/embed.js"></script>\\n<creative-engine src="${currentUrl}"></creative-engine>`;
                    shareLinksDiv.style.display = 'block'; publishMessage.style.display = 'none';
                } else {
                    shareLinksDiv.style.display = 'none'; publishMessage.style.display = 'block';
                }
                shareModal.style.display = 'flex';
            });
        }
        if (document.getElementById('closeShareBtn')) document.getElementById('closeShareBtn').addEventListener('click', () => { shareModal.style.display = 'none'; });
        if (document.getElementById('nativeShareBtn')) document.getElementById('nativeShareBtn').addEventListener('click', () => { projectManager.shareProject(); });

        // --- Bottom Nav Logic ---
"""

# Find original script block to replace
match = re.search(r'(<script>\s*function CustomLoadingScreen.*?)(registerFieldColour\(\);)', content, re.DOTALL)
if match:
    # Use simpler marker check
    pass

# We'll replace the entire area from start of first relevant script to end of last.
# Actually, I'll just use a more surgical approach for the module script.
content = re.sub(r'<script>\s*function CustomLoadingScreen.*?</script>', new_script + '    </script>', content, flags=re.DOTALL)

# Clean up other leftovers
content = content.replace('toolbox: toolbox,', 'toolbox: mainToolbox,')
content = content.replace('registerFieldColour();', '// registerFieldColour();')
content = content.replace('installAllBlocks({', 'registerBlocks(Blockly, { getModelAssets, getAudioAssets, getImageAssets }); // installAllBlocks({')

with open('_layouts/default.html', 'w') as f:
    f.write(content)
