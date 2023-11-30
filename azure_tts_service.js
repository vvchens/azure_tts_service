"use strict";

assert(process.env.APIKEY)

const sdk = require("microsoft-cognitiveservices-speech-sdk");

const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.APIKEY, "eastus");
// const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

// The language of the voice that speaks.
speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoxiaoNeural";
// zh-CN-XiaoxiaoNeural (Female)
// zh-CN-YunxiNeural (Male)
// zh-CN-YunjianNeural (Male)
// zh-CN-XiaoyiNeural (Female)
// zh-CN-YunyangNeural (Male)
// zh-CN-XiaochenNeural (Female)
// zh-CN-XiaohanNeural (Female)
// zh-CN-XiaomengNeural (Female)
// zh-CN-XiaomoNeural (Female)
// zh-CN-XiaoqiuNeural (Female)
// zh-CN-XiaoruiNeural (Female)
// zh-CN-XiaoshuangNeural (Female, Child)
// zh-CN-XiaoxuanNeural (Female)
// zh-CN-XiaoyanNeural (Female)
// zh-CN-XiaoyouNeural (Female, Child)
// zh-CN-XiaozhenNeural (Female)
// zh-CN-YunfengNeural (Male)
// zh-CN-YunhaoNeural (Male)
// zh-CN-YunxiaNeural (Male)
// zh-CN-YunyeNeural (Male)
// zh-CN-YunzeNeural (Male)

speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3

class handler extends sdk.PushAudioOutputStreamCallback {
    constructor(write, close) {
        super()
        this.write = write
        this.close = close
    }
}

function azure_tts(text, outputBuffer) {
    return new Promise((res, rej) => {
        console.log(`synthesising "${text}"`);
        // Create the speech synthesizer.
        var audioConfig = sdk.AudioConfig.fromStreamOutput(new handler((buffer) => {
            outputBuffer(buffer)
        }), () => res(false))
        var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        synthesizer.speakTextAsync(text, (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("synthesis finished.");
            } else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
            synthesizer.close();
            synthesizer = null;
            res(true)
        }, (err) => {
            console.trace("err - " + err);
            synthesizer.close();
            synthesizer = null;
            rej(err)
        });
    })
}

module.exports=azure_tts