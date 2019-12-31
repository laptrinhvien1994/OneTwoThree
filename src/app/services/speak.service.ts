import { Injectable } from '@angular/core';

// https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

@Injectable({
    providedIn: 'root'
})
export class SpeakService {
    private speakSynth;
    private voices;

    constructor() {
        this.speakSynth = window.speechSynthesis;
        this.voices = this.speakSynth.getVoices();
    }

    speak(text: string, callback?: (event) => void) {
        const utterance = new SpeechSynthesisUtterance();
        const voiceOfGoogleUSEnglish = this.voices.find(v => v.name === 'Google US English');
        utterance.voice = voiceOfGoogleUSEnglish;
        utterance.text = text;
        this.speakSynth.speak(utterance);
        const eventCallback = (event) => {
            if (!!callback) {
                callback(event);
            }
            utterance.removeEventListener('end', eventCallback);
        };
        utterance.addEventListener('end', eventCallback);
    }

    isSpeaking(): boolean {
        return this.speakSynth.speaking;
    }

    stopSpeaking(){
        this.speakSynth.cancel();
    }
}
