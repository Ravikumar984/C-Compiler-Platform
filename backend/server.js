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

// ---------- Secure Compile & Run using JDoodle API ----------
app.post('/api/run', async (req, res) => {
  const { code, stdin: userStdin } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'No code provided.' });
  }

  try {
    // Send code to JDoodle public API
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      script: code,
      stdin: userStdin || '',
      language: 'c',
      version: '4', // JDoodle's GCC version for C
      // Note: JDoodle free tier works without credentials for public endpoints or basic usage, 
      // but if needed, it uses standard POST payloads.
    });

    const data = response.data;

    // JDoodle returns the output in 'output' field
    if (data.error) {
      return res.json({ success: false, error: data.error });
    }

    return res.json({ success: true, output: data.output || 'Program executed with no output.' });

  } catch (err) {
    console.error('Compiler API Error:', err.message);
    res.status(500).json({ error: 'Failed to reach the free evaluation server.' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure C compiler backend running on http://localhost:${PORT}`);
});