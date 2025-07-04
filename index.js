const express = require('express')
const app = express()

const tts_service = require('./azure_tts_service')

app.get('/tts', async (req, res) => {
  var text = req.query['txt']
  var voice = req.query['voice'] // 可选参数
  if (!text) {
    res.status(400).send('Missing txt parameter')
    return
  }
  res.statusCode = 200
  res.type("mp3")
  // 通过 Promise 控制流，确保在流关闭时调用 res.end()
  try {
    await tts_service(text, (buffer) => {
      // 直接写入 Buffer
      res.write(Buffer.from(buffer))
    }, voice)
    res.end()
  } catch (e) {
    res.destroy()
  }
})

app.listen(process.env.PORT ?? 3000)


