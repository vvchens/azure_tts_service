const express = require('express')
const app = express()

const tts_service = require('./azure_tts_service')

app.get('/tts', async (req, res) => {
  var text = req.query['txt']
  res.statusCode = 200
  res.type("mp3")
  if (await tts_service(text, (buffer) => {
    var chunk = new Uint8Array(buffer)
    res.write(chunk)
  }) === true) {
    res.end()
  } else {
    res.destroy()
  }
})

app.listen(process.env.PORT ?? 3000)


