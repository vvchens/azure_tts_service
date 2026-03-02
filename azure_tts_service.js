"use strict";

const { sdk, getSpeechConfig } = require('./azure_config');

class PushAudioOutputStreamHandler extends sdk.PushAudioOutputStreamCallback {
    constructor(writeCallback) {
        super();
        this.writeCallback = writeCallback;
    }
    write(dataBuffer) {
        this.writeCallback(dataBuffer);
    }
    close() {
        // stream closed
    }
}

function azure_tts(text, writeCallback, voiceName = "zh-CN-XiaoxiaoNeural") {
    return new Promise((resolve, reject) => {
        try {
            const speechConfig = getSpeechConfig();
            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
            speechConfig.speechSynthesisVoiceName = voiceName;

            const pushStreamCallback = new PushAudioOutputStreamHandler((buffer) => {
                writeCallback(buffer);
            });
            const audioConfig = sdk.AudioConfig.fromStreamOutput(pushStreamCallback);
            const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

            console.log(`synthesising "${text}"`);

            synthesizer.speakTextAsync(
                text,
                (result) => {
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        console.log("Synthesis finished.");
                    } else {
                        console.error("Speech synthesis canceled, " + result.errorDetails);
                    }
                    synthesizer.close();
                    resolve(true);
                },
                (err) => {
                    console.error("Synthesis error: " + err);
                    synthesizer.close();
                    reject(err);
                }
            );
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = azure_tts;
