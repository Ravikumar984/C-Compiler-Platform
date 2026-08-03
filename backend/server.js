const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 5000;

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---------- Secure Compile & Run using Piston (100% FREE & NO API KEY) ----------
app.post('/api/run', async (req, res) => {
  const { code, stdin: userStdin } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'No code provided.' });
  }

  try {
    // Send code to the free Piston API
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '*', // Automatically uses the latest C compiler available
      files: [
        {
          content: code
        }
      ],
      stdin: userStdin || ''
    });

    const { run, compile } = response.data;

    // 1. Handle Compilation Errors
    if (compile && compile.code !== 0) {
      return res.json({ success: false, error: compile.stderr || compile.output });
    }

    // 2. Handle Runtime Errors (e.g., Segfaults, timeouts)
    if (run.code !== 0) {
      return res.json({ success: false, error: run.stderr || run.output || 'Runtime error occurred.' });
    }

    // 3. Success! Return the output
    return res.json({ success: true, output: run.stdout || 'Program executed with no output.' });

  } catch (err) {
    console.error('Piston API Error:', err.message);
    res.status(500).json({ error: 'Failed to reach the free evaluation server.' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure C compiler backend running on http://localhost:${PORT}`);
});