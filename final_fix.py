import re
import sys

with open("_layouts/default.html", "r") as f:
    content = f.read()

# 1. Add CSS
css = """
        /* Share Modal Styles */
        .modal { display: none; position: fixed; z-index: 4000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); justify-content: center; align-items: center; }
        .modal-content { background-color: #fefefe; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); position: relative; font-family: Arial, sans-serif; color: #333; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h2 { margin: 0; }
        .close-modal { font-size: 28px; font-weight: bold; cursor: pointer; color: #aaa; }
        .close-modal:hover { color: #000; }
        .share-group { margin-bottom: 20px; }
        .share-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        .share-input-container { display: flex; gap: 5px; }
        .share-input-container input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        .btn-copy { background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
        .btn-copy:hover { background-color: #0056b3; }
"""
content = content.replace("</style>", css + "</style>", 1)

# 2. Add HTML
html = """
    <div id="shareModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Share Project</h2>
                <span class="close-modal" id="closeShareModal">&times;</span>
            </div>
            <div class="share-group">
                <label for="share-url">Share Link</label>
                <div class="share-input-container">
                    <input type="text" id="share-url" readonly>
                    <button id="copyShareUrl" class="btn-copy">Copy</button>
                </div>
            </div>
            <div class="share-group">
                <label for="embed-code">Embed Code</label>
                <div class="share-input-container">
                    <input type="text" id="embed-code" readonly>
                    <button id="copyEmbedCode" class="btn-copy">Copy</button>
                </div>
            </div>
        </div>
    </div>
"""
content = content.replace("<body>", "<body>" + html)

# 3. Update BabylonSceneManager
content = content.replace("constructor(canvas) {", 'constructor(canvas, root = document, assetManager = null) { this.root = root; this.assetManager = assetManager;\n                this._getElementById = (id) => this.root.getElementById ? this.root.getElementById(id) : this.root.querySelector("#" + id);')

class_start = content.find("class BabylonSceneManager")
class_end = content.find("class UIManager", class_start)
if class_start != -1 and class_end != -1:
    class_body = content[class_start:class_end]
    class_body = class_body.replace("document.getElementById('joystick-zone')", "this._getElementById('joystick-zone')")
    class_body = class_body.replace('document.getElementById("jump-button-container")', 'this._getElementById("jump-button-container")')
    class_body = class_body.replace("document.querySelectorAll('.interactive-ui')", "this.root.querySelectorAll('.interactive-ui')")
    class_body = class_body.replace("document.querySelector('.canvas-container')", "this.root.querySelector('.canvas-container')")
    content = content[:class_start] + class_body + content[class_end:]

# 4. publishProject
match = re.search(r"async publishProject\(\) \{", content)
if match:
    idx = content.find("workspace: workspaceState,", match.start())
    if idx != -1:
        content = content[:idx] + "code: generateCode(),\n                        " + content[idx:]
    idx_b64 = content.find("const base64WorkspaceData = btoa(jsonString);", match.start())
    if idx_b64 != -1:
        content = content[:idx_b64] + "const base64WorkspaceData = btoa(unescape(encodeURIComponent(jsonString)));" + content[idx_b64 + len("const base64WorkspaceData = btoa(jsonString);"):]

# 5. shareProject
share_logic = """
            async shareProject() {
                const workspaceDataEl = document.getElementById("workspace-data");
                if (!workspaceDataEl || !workspaceDataEl.textContent.trim()) {
                    alert("This project must be published before it can be shared or embedded. Please use the Publish button first.");
                    return;
                }
                const shareUrl = window.location.href.split("?")[0].split("#")[0];
                const runtimeUrl = window.location.origin + "/assets/js/engine-runtime.js";
                const embedCode = '<creative-engine-player project-url="' + shareUrl + '"></creative-engine-player>' + '\\n' + '<script src="' + runtimeUrl + '"></script>';
                document.getElementById("share-url").value = shareUrl;
                document.getElementById("embed-code").value = embedCode;
                document.getElementById("shareModal").style.display = "flex";
            }
"""
start_match = re.search(r"async shareProject\(\) \{", content)
if start_match:
    start_idx = start_match.start()
    brace_count = 0
    end_idx = -1
    for i in range(start_idx, len(content)):
        if content[i] == "{": brace_count += 1
        elif content[i] == "}": brace_count -= 1
        if brace_count == 0 and i > start_idx:
            end_idx = i + 1
            break
    if end_idx != -1:
        content = content[:start_idx] + share_logic + content[end_idx:]

# 6. Listeners
listeners = """
        // Share Modal Listeners
        document.getElementById("closeShareModal").onclick = () => { document.getElementById("shareModal").style.display = "none"; };
        window.onclick = (e) => { if (e.target == document.getElementById("shareModal")) document.getElementById("shareModal").style.display = "none"; };
        const copyToClip = (id, msg) => {
            const input = document.getElementById(id);
            input.select();
            navigator.clipboard.writeText(input.value).then(() => alert(msg)).catch(err => console.error(err));
        };
        document.getElementById("copyShareUrl").onclick = () => copyToClip("share-url", "Share link copied!");
        document.getElementById("copyEmbedCode").onclick = () => copyToClip("embed-code", "Embed code copied!");
"""
target_listener = "document.getElementById('shareButton').addEventListener('click'"
content = content.replace(target_listener, listeners + "\n        " + target_listener)

# 7. doRun
content = content.replace("new BabylonSceneManager(canvas)", "new BabylonSceneManager(canvas, document, assetManager)")

# 8. Encoding fixes
content = content.replace("const decodedData = atob(workspaceDataEl.textContent.trim());", "const decodedData = decodeURIComponent(escape(atob(workspaceDataEl.textContent.trim())));")
content = content.replace("const decodedState = atob(projectParam);", "const decodedState = decodeURIComponent(escape(atob(projectParam)));")

with open("_layouts/default.html", "w") as f:
    f.write(content)
