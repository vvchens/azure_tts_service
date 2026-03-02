const sdk = require("microsoft-cognitiveservices-speech-sdk");

function getSpeechConfig() {
    if (!process.env.APIKEY) {
        throw new Error("Missing APIKEY environment variable");
    }
    const region = process.env.REGION || "eastus";
    return sdk.SpeechConfig.fromSubscription(process.env.APIKEY, region);
}

module.exports = {
    sdk,
    getSpeechConfig
};
