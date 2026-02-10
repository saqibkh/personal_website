// processor.js
class MeterProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._volume = 0;
        this._updateIntervalInFrames = 25; // approx 20ms at 48k sample rate
        this._nextUpdateFrame = this._updateIntervalInFrames;
    }

    get intervalInFrames() {
        return this._updateIntervalInFrames;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];

        // Note: Input can be empty if no audio is playing
        if (input.length > 0) {
            const samples = input[0];
            let sum = 0;
            let rms = 0;

            // Calculate RMS (Root Mean Square)
            for (let i = 0; i < samples.length; ++i) {
                sum += samples[i] * samples[i];
            }
            rms = Math.sqrt(sum / samples.length);

            // Smooth volume (decay) to prevent jittery needle
            this._volume = Math.max(rms, this._volume * 0.95);

            // Send data back to main thread periodically
            this._nextUpdateFrame -= samples.length;
            if (this._nextUpdateFrame < 0) {
                this._nextUpdateFrame += this.intervalInFrames;
                this.port.postMessage({volume: this._volume});
            }
        }

        return true; // Keep processor alive
    }
}

registerProcessor('meter-processor', MeterProcessor);
