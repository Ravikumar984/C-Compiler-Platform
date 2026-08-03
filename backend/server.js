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

// ---------- Secure Compile & Run using Glot.io (100% Free, No API Key, No OCI limits) ----------
app.post('/api/run', async (req, res) => {
  const { code, stdin: userStdin } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'No code provided.' });
  }

  try {
    // Send code to Glot.io's public C execution endpoint
    const response = await axios.post('https://snippets.glot.io/snippets', {
      language: 'c',
      title: 'main.c',
      files: [
        {
          name: 'main.c',
          content: code
        }
      ],
      stdin: userStdin || ''
    }, {
      timeout: 10000 // 10 second timeout guard
    });

    // Glot returns a snippet ID, now we trigger execution on it
    const snippetId = response.data.id;
    const runResponse = await axios.post(`https://snippets.glot.io/snippets/${snippetId}/c`, {
      stdin: userStdin || ''
    }, {
      timeout: 10000
    });

    const result = runResponse.data;

    // Check if there was a compilation or stderr error
    if (result.stderr) {
      return res.json({ success: false, error: result.stderr });
    }

    // Success! Return stdout
    return res.json({ success: true, output: result.stdout || result.output || 'Program executed with no output.' });

  } catch (err) {
    console.error('Compiler API Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to reach the free evaluation server.' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure C compiler backend running on http://localhost:${PORT}`);
});