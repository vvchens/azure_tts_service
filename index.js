require('dotenv').config();

const express = require('express');
const app = express();

const tts_service = require('./azure_tts_service');

app.get('/tts', async (req, res) => {
  var text = req.query['txt'];
  var voice = req.query['voice']; // 可选参数
  if (!text) {
    res.status(400).send('Missing txt parameter');
    return;
  }

  res.statusCode = 200;
  res.type("mp3");

  // 通过 Promise 控制流，确保在流关闭时调用 res.end()
  try {
    await tts_service(text, (buffer) => {
      // 直接写入 Buffer
      res.write(Buffer.from(buffer));
    }, voice);
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    } else {
      res.end();
    }
  }
});

// Added POST route for TTS to support text sent in body
app.post('/tts', express.text({ type: '*/*', limit: '50mb' }), async (req, res) => {
  var text = req.body || req.query['txt'];
  var voice = req.query['voice']; // 可选参数
  if (!text || typeof text !== 'string') {
    res.status(400).send('Missing txt parameter or body');
    return;
  }

  res.statusCode = 200;
  res.type("mp3");

  try {
    await tts_service(text, (buffer) => {
      res.write(Buffer.from(buffer));
    }, voice);
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    } else {
      res.end();
    }
  }
});

const stt_service = require('./azure_stt_service');
const translation_service = require('./azure_translation_service');

app.post('/stt', async (req, res) => {
    const language = req.query['lang'] || 'zh-CN';
    // Use req as the stream directly. Node's `req` implements Readable.
    // Ensure no body-parser is consuming it fully into req.body for these routes
    // (since we removed the app.use(express.raw(...)) earlier)
    try {
        const text = await stt_service(req, language);
        res.status(200).json({ text });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});

app.post('/translate', async (req, res) => {
    const sourceLanguage = req.query['from'] || 'zh-CN';
    const targetLanguages = req.query['to'] || 'en-US';

    // Use req as the stream directly
    try {
        const result = await translation_service(req, sourceLanguage, targetLanguages);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});

app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
});
