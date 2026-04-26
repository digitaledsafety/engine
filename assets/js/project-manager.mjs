export class ProjectManager {
            constructor(assetManager, workspace, sceneManager) {
                this.assetManager = assetManager;
                this.workspace = workspace;
                this.sceneManager = sceneManager;
            }

            async saveProject() {
                try {

            const workspaceState = Blockly.serialization.workspaces.save(this.workspace);
            const generatedCode = javascript.javascriptGenerator.workspaceToCode(this.workspace);
            const assets = await this.assetManager.getAllAssets();
            const serializableAssets = [];
            for (const asset of assets) {
                let d;
                if (asset.data instanceof Blob) d = await this._blobToBase64(asset.data);
                else if (asset.data instanceof ArrayBuffer) d = this._arrayBufferToBase64(asset.data);
                else continue;
                serializableAssets.push({ name: asset.name, type: asset.type, data: d });
            }
            const projectData = { workspace: workspaceState, code: generatedCode, assets: serializableAssets, version: '1.1' };

                    // 4. Create and trigger download
                    const jsonString = JSON.stringify(projectData, null, 2);
                    const blob = new Blob([jsonString], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `project-${Date.now()}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log('Project saved successfully!');

                } catch (error) {
                    console.error('Failed to save project:', error);
                    alert('Error saving project. See console for details.');
                }
            }

            async publishProject() {
                try {

            const workspaceState = Blockly.serialization.workspaces.save(this.workspace);
            const generatedCode = javascript.javascriptGenerator.workspaceToCode(this.workspace);
            const assets = await this.assetManager.getAllAssets();
            const serializableAssets = [];
            for (const asset of assets) {
                let d;
                if (asset.data instanceof Blob) d = await this._blobToBase64(asset.data);
                else if (asset.data instanceof ArrayBuffer) d = this._arrayBufferToBase64(asset.data);
                else continue;
                serializableAssets.push({ name: asset.name, type: asset.type, data: d });
            }
            const projectData = { workspace: workspaceState, code: generatedCode, assets: serializableAssets, version: '1.1' };

                    // 4. Create Jekyll-compatible markdown file content
                    const jsonString = JSON.stringify(projectData, null, 2);
                    const base64WorkspaceData = btoa(jsonString); // web-safe base64 encoding
                    const uniqueId = `workspace-${Date.now()}`;
                    const markdownContent = `---
layout: "default"
title: "${uniqueId}"
workspace_data: "${base64WorkspaceData}"
---
`;

                    // 5. Create and trigger download
                    const blob = new Blob([markdownContent], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${uniqueId}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log('Project published successfully!');
                    alert(`Project published as ${uniqueId}.md. Please add this file to the _workspaces directory in your project repository.`);

                } catch (error) {
                    console.error('Failed to publish project:', error);
                    alert('Error publishing project. See console for details.');
                }
            }

            // --- Helper methods for serialization ---

            _arrayBufferToBase64(buffer) {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
            }

            _blobToBase64(blob) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove the data URI prefix
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            async loadProjectData(projectData) {
                if (!projectData.workspace || !projectData.assets) {
                    throw new Error('Invalid project data format.');
                }

                // 1. Clear current scene and assets
                this.sceneManager.clear();
                await this._clearAllAssets();
                this.workspace.clear();

                // 2. Load Assets
                for (const asset of projectData.assets) {
                    const data = this._base64ToBlob(asset.data, asset.type);
                    await this.assetManager.addAsset(new File([data], asset.name, { type: asset.type }));
                }
                // The asset view needs to be re-rendered to show the new assets
                loadAssetsIntoView();

                // 3. Load Workspace
                Blockly.serialization.workspaces.load(projectData.workspace, this.workspace);

                // 4. Run the loaded project
                doRun();

                console.log('Project data loaded successfully!');
            }

            async loadProject() {
                try {
                    const file = await this._selectFile();
                    const content = await this._readFile(file);
                    const projectData = JSON.parse(content);
                    await this.loadProjectData(projectData);
                } catch (error) {
                    console.error('Failed to load project:', error);
                    alert('Error loading project. See console for details.');
                }
            }

            _base64ToBlob(b64Data, contentType = '', sliceSize = 512) {
                const byteCharacters = atob(b64Data);
                const byteArrays = [];

                for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    const slice = byteCharacters.slice(offset, offset + sliceSize);
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }

                return new Blob(byteArrays, { type: contentType });
            }

            async _clearAllAssets() {
                const allAssets = await this.assetManager.getAllAssets();
                for (const asset of allAssets) {
                    await this.assetManager.deleteAsset(asset.name);
                }
            }

            _selectFile() {
                return new Promise(resolve => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.txt';
                    input.onchange = e => {
                        const file = e.target.files[0];
                        if (file) {
                            resolve(file);
                        }
                    };
                    input.click();
                });
            }

            _readFile(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
            }

            async shareProject() {
                try {
                    const workspaceState = Blockly.serialization.workspaces.save(this.workspace);
                    const assets = await this.assetManager.getAllAssets();
                    const serializableAssets = [];

                    for (const asset of assets) {
                        let dataB64;
                        if (asset.data instanceof Blob) {
                            dataB64 = await this._blobToBase64(asset.data);
                        } else if (asset.data instanceof ArrayBuffer) {
                            dataB64 = this._arrayBufferToBase64(asset.data);
                        } else {
                            continue;
                        }
                        serializableAssets.push({
                            name: asset.name,
                            type: asset.type,
                            data: dataB64
                        });
                    }

                    const projectData = {
                        workspace: workspaceState,
                        assets: serializableAssets,
                        version: '1.0'
                    };

                    const jsonString = JSON.stringify(projectData, null, 2);
                    const file = new File([jsonString], 'project.txt', { type: 'text/plain' });

                    if (navigator.share && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'My Project',
                            text: 'Check out my project!',
                        });
                    } else {
                        this.saveProject();
                    }
                } catch (error) {
                    console.error('Error sharing project:', error);
                    if (error.name !== 'AbortError') {
                        alert('Error sharing project. See console for details.');
                    }
                }
            }

        }
