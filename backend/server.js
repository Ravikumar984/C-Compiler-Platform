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

// ---------- Secure Compile & Run using Piston v2 Official Endpoint ----------
app.post('/api/run', async (req, res) => {
  const { code, stdin: userStdin } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'No code provided.' });
  }

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '10.2.0',
      files: [
        {
          name: 'main.c',
          content: code
        }
      ],
      stdin: userStdin || ''
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const { run, compile } = response.data;

    if (compile && compile.code !== 0) {
      return res.json({ success: false, error: compile.stderr || compile.output });
    }

    if (run && run.code !== 0) {
      return res.json({ success: false, error: run.stderr || run.output || 'Runtime error occurred.' });
    }

    return res.json({ success: true, output: run?.stdout || 'Program executed with no output.' });

  } catch (err) {
    console.error('Compiler API Error Details:', err.response?.data || err.message);
    const errorMsg = err.response?.data?.message || err.message || 'Failed to reach evaluation server.';
    res.status(500).json({ error: `Execution error: ${errorMsg}` });
  }
});

app.listen(PORT, () => {
  console.log(`Secure C compiler backend running on http://localhost:${PORT}`);
});