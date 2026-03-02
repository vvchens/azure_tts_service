"use strict";

const { sdk, getSpeechConfig } = require('./azure_config');

function azure_stt(audioStream, language = "zh-CN") {
    return new Promise((resolve, reject) => {
        try {
            const speechConfig = getSpeechConfig();
            speechConfig.speechRecognitionLanguage = language;

            // Using PushAudioInputStream to handle incoming stream data from Express request
            const pushStream = sdk.AudioInputStream.createPushStream();
            const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

            const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

            // Forward data from Express stream to Azure Speech SDK push stream
            audioStream.on('data', (data) => {
                // Safely extract the chunk's exact memory from the buffer
                pushStream.write(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
            });

            audioStream.on('end', () => {
                pushStream.close();
            });

            audioStream.on('error', (err) => {
                pushStream.close();
                reject(err);
            });

            let fullText = "";

            recognizer.recognized = (s, e) => {
                if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                    fullText += e.result.text + " ";
                }
            };

            recognizer.canceled = (s, e) => {
                if (e.reason === sdk.CancellationReason.Error) {
                    console.error(`CANCELED: ErrorCode=${e.errorCode}`);
                    console.error(`CANCELED: ErrorDetails=${e.errorDetails}`);
                    recognizer.stopContinuousRecognitionAsync();
                    recognizer.close();
                    reject(new Error(e.errorDetails));
                }
            };

            recognizer.sessionStopped = (s, e) => {
                recognizer.stopContinuousRecognitionAsync();
                recognizer.close();
                resolve(fullText.trim());
            };

            recognizer.startContinuousRecognitionAsync();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = azure_stt;
