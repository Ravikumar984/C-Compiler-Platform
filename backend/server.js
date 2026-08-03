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

// ---------- Secure Compile & Run using Wandbox (100% FREE, NO IP BLOCKS) ----------
app.post('/api/run', async (req, res) => {
  const { code, stdin: userStdin } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'No code provided.' });
  }

  try {
    // Send code to the free Wandbox API
    const response = await axios.post('https://wandbox.org/api/compile.json', {
      compiler: 'gcc-head', // Always uses the latest GCC version
      code: code,
      stdin: userStdin || '',
      save: false
    });

    const data = response.data;

    // 1. Handle Compilation Errors (Syntax errors, missing semicolons, etc.)
    if (data.compiler_error) {
      return res.json({ success: false, error: data.compiler_error });
    }

    // 2. Handle Runtime Errors (Segfaults, division by zero, etc.)
    // Wandbox returns status "0" for success, anything else is an error
    if (data.status !== "0") {
      return res.json({ success: false, error: data.program_error || 'Runtime error occurred.' });
    }

    // 3. Success! Return the output
    return res.json({ success: true, output: data.program_message || 'Program executed with no output.' });

  } catch (err) {
    console.error('Compiler API Error:', err.message);
    res.status(500).json({ error: 'Failed to reach the free evaluation server.' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure C compiler backend running on http://localhost:${PORT}`);
});