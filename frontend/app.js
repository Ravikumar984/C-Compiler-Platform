// ==========================================
// CONFIGURATION
// ==========================================
// Change this to your live Render backend URL once deployed,
// e.g., 'https://c-compiler-backend-xyz.onrender.com/api'
// If testing locally, use 'http://localhost:5000/api'
const API_BASE = 'http://localhost:5000/api';

const defaultCode = `#include <stdio.h>\n\nint main() {\n    printf("Hello World!\\n");\n    return 0;\n}\n`;

// ==========================================
// INITIALIZE EDITOR
// ==========================================
const editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
  mode: 'text/x-csrc',
  theme: 'dracula',
  lineNumbers: true,
  tabSize: 4
});
editor.setValue(defaultCode);

const runBtn = document.getElementById('runBtn');
const outputTerminal = document.getElementById('outputTerminal');
const stdinInput = document.getElementById('stdinInput');

// ==========================================
// EXECUTION LOGIC
// ==========================================
runBtn.addEventListener('click', async () => {
  outputTerminal.textContent = 'Compiling and executing...';
  try {
    const res = await fetch(`${API_BASE}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: editor.getValue(), stdin: stdinInput.value })
    });
    const data = await res.json();
    outputTerminal.textContent = data.output || data.error || 'Execution finished.';
  } catch (err) {
    outputTerminal.textContent = 'Error: Cannot reach the backend.';
  }
});

// ==========================================
// ANTI-CHEAT & EXAM ENVIRONMENT FEATURES
// ==========================================
let warningCount = 0;
const MAX_WARNINGS = 3;

// 1. Detect Tab Switching (Page Visibility API)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    warningCount++;
    alert(`⚠️ Warning ${warningCount}/${MAX_WARNINGS}: You switched tabs or minimized the window!`);
    
    if (warningCount >= MAX_WARNINGS) {
      alert("🚨 Test terminated due to multiple violations.");
      // Lock the editor and remove the run button
      editor.setOption("readOnly", true);
      runBtn.disabled = true;
      document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%; font-family:sans-serif;'>Test Terminated (Cheating Detected)</h1>";
    }
  }
});

// 2. Disable Right-Click (Context Menu)
document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

// 3. Disable Copying and Pasting
document.addEventListener('copy', (event) => {
  event.preventDefault();
  alert("Copying code is disabled during the test.");
});

document.addEventListener('paste', (event) => {
  event.preventDefault();
  alert("Pasting external code is not allowed!");
});

// 4. Force Fullscreen on "Run"
runBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Fullscreen error: ${err.message}`);
        });
    }
});