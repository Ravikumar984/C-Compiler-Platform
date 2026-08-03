// Ensure this matches your live Render URL
const API_BASE = 'https://c-compiler-platform.onrender.com/api'; 

// 1. Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code'), {
    mode: 'text/x-csrc',
    theme: 'dracula',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4
});

// 2. Set some default starter code
if (!editor.getValue()) {
    editor.setValue(`#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`);
}

// 3. Grab all the HTML elements we need to interact with
const runBtn = document.getElementById('runBtn');
const outputEl = document.getElementById('output');
const stdinEl = document.getElementById('stdin');
const statusPill = document.getElementById('statusPill');
const timingInfo = document.getElementById('timingInfo');

// 4. Handle the "Run" button click
runBtn.addEventListener('click', async () => {
    const sourceCode = editor.getValue();
    const stdin = stdinEl.value;

    // Don't run if the editor is empty
    if (!sourceCode.trim()) {
        outputEl.textContent = 'Please enter some C code to run.';
        return;
    }

    // Update UI to show loading state
    runBtn.disabled = true;
    statusPill.textContent = 'running...';
    statusPill.className = 'status-pill';
    statusPill.style.color = '#f1fa8c'; // Yellow for running
    outputEl.textContent = 'Compiling and executing...';
    timingInfo.textContent = '';

    const startTime = Date.now();

    try {
        // FIXED: Now targets the /run route to match your backend perfectly
        const response = await fetch(`${API_BASE}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: sourceCode,
                stdin: stdin // FIXED: Now properly sending 'stdin' instead of 'input'
            })
        });

        const data = await response.json();
        const executionTime = Date.now() - startTime;

        // Display the output and update status based on your backend's 'success' variable
        if (data.success) {
            outputEl.textContent = data.output;
            statusPill.textContent = 'success';
            statusPill.style.color = '#50fa7b'; // Green for success
        } else {
            outputEl.textContent = data.error || 'An error occurred during execution.';
            statusPill.textContent = 'error';
            statusPill.style.color = '#ff5555'; // Red for error
        }

        // Show how long it took
        timingInfo.textContent = `executed in ${executionTime}ms`;

    } catch (error) {
        console.error('Error executing code:', error);
        outputEl.textContent = 'Network error: Failed to connect to the backend server. Please make sure your Render backend is live.';
        statusPill.textContent = 'error';
        statusPill.style.color = '#ff5555';
    } finally {
        // Re-enable the run button
        runBtn.disabled = false;
    }
});