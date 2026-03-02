"use strict";

const { sdk, getSpeechConfig } = require('./azure_config');

function azure_translation(audioStream, sourceLanguage = "zh-CN", targetLanguages = ["en-US"]) {
    return new Promise((resolve, reject) => {
        try {
            // Need SpeechTranslationConfig for translation
            if (!process.env.APIKEY) {
                throw new Error("Missing APIKEY environment variable");
            }
            const region = process.env.REGION || "eastus";
            const translationConfig = sdk.SpeechTranslationConfig.fromSubscription(process.env.APIKEY, region);

            translationConfig.speechRecognitionLanguage = sourceLanguage;

            // Allow comma-separated string or array
            let targets = Array.isArray(targetLanguages) ? targetLanguages : targetLanguages.split(',');
            targets.forEach(lang => {
                translationConfig.addTargetLanguage(lang.trim());
            });

            // Using PushAudioInputStream to handle incoming stream data
            const pushStream = sdk.AudioInputStream.createPushStream();
            const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

            const recognizer = new sdk.TranslationRecognizer(translationConfig, audioConfig);

            // Forward data from Express stream to Azure Speech SDK push stream
            audioStream.on('data', (data) => {
                pushStream.write(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
            });

            audioStream.on('end', () => {
                pushStream.close();
            });

            audioStream.on('error', (err) => {
                pushStream.close();
                reject(err);
            });

            let fullSourceText = "";
            let fullTranslations = {};
            targets.forEach(lang => {
                fullTranslations[lang.trim()] = "";
            });

            recognizer.recognized = (s, e) => {
                if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {
                    fullSourceText += e.result.text + " ";
                    for (let lang of targets) {
                        const trimmedLang = lang.trim();
                        const trans = e.result.translations.get(trimmedLang) || e.result.translations.get(trimmedLang.split('-')[0]);
                        if (trans) {
                            fullTranslations[trimmedLang] += trans + " ";
                        }
                    }
                } else if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                    fullSourceText += e.result.text + " ";
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
                // Trim trailing spaces
                fullSourceText = fullSourceText.trim();
                for (let lang in fullTranslations) {
                    fullTranslations[lang] = fullTranslations[lang].trim();
                }

                recognizer.stopContinuousRecognitionAsync();
                recognizer.close();
                resolve({
                    sourceText: fullSourceText,
                    translations: fullTranslations
                });
            };

            recognizer.startContinuousRecognitionAsync();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = azure_translation;
