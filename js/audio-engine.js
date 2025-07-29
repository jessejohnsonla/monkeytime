class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.sampleBuffer = null;
        this.activeSources = [];
        this.initialized = false;
        this.userGestureReceived = false;
    }

    async init() {
        try {
            // Don't create AudioContext until user gesture
            if (!this.userGestureReceived) {
                console.log('Waiting for user gesture to initialize audio...');
                return false;
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create a default sample if none loaded
            if (!this.sampleBuffer) {
                this.createDefaultSample();
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            return false;
        }
    }

    createDefaultSample() {
        // Create a simple piano-like sound using oscillators
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2.0;
        const length = sampleRate * duration;
        
        this.sampleBuffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = this.sampleBuffer.getChannelData(0);
        
        // Generate a piano-like sound with harmonics
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const freq = 261.63; // C4
            
            // Fundamental + harmonics with envelope
            const envelope = Math.exp(-t * 2); // Decay envelope
            const fundamental = Math.sin(2 * Math.PI * freq * t);
            const harmonic2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.5;
            const harmonic3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.25;
            
            data[i] = envelope * (fundamental + harmonic2 + harmonic3) * 0.3;
        }
    }

    async loadSample(file) {
        console.log('Loading sample:', file.name, file.type, file.size);
        
        if (!this.initialized) {
            const success = await this.init();
            if (!success) {
                console.error('Audio engine not initialized');
                return false;
            }
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            console.log('File loaded into array buffer, size:', arrayBuffer.byteLength);
            
            this.sampleBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('Sample decoded successfully:', this.sampleBuffer);
            return true;
        } catch (error) {
            console.error('Failed to load sample:', error);
            return false;
        }
    }

    async playNote(frequency, duration = 1.0) {
        if (!this.checkAudioContextHealth()) {
            console.warn('Audio context unhealthy, attempting to reactivate');
            const success = await this.activateAudioContext();
            if (!success) {
                console.error('Failed to reactivate audio context');
                return;
            }
        }
        
        if (!this.sampleBuffer) {
            console.warn('No sample loaded, creating default sample');
            this.createDefaultSample();
        }

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.sampleBuffer;
            
            const baseFrequency = 261.63; // C4
            const playbackRate = frequency / baseFrequency;
            source.playbackRate.value = playbackRate;
            
            gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start(this.audioContext.currentTime);
            source.stop(this.audioContext.currentTime + duration);
            
            this.activeSources.push(source);
            
            source.onended = () => {
                const index = this.activeSources.indexOf(source);
                if (index > -1) {
                    this.activeSources.splice(index, 1);
                }
            };
            
        } catch (error) {
            console.error('Failed to play note:', error);
        }
    }

    stopAllNotes() {
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                // Source may already be stopped
            }
        });
        this.activeSources = [];
    }

    calculateFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    async playChord(midiNotes, duration = 2.0) {
        // Check audio health once for the entire chord
        if (!this.checkAudioContextHealth()) {
            console.warn('Audio context unhealthy, attempting to reactivate');
            const success = await this.activateAudioContext();
            if (!success) {
                console.error('Failed to reactivate audio context');
                return;
            }
        }

        midiNotes.forEach(async note => {
            const frequency = this.calculateFrequency(note);
            await this.playNote(frequency, duration);
        });
    }

    async activateAudioContext() {
        this.userGestureReceived = true;
        
        // Check if context is lost/closed and needs recreation
        if (!this.audioContext || this.audioContext.state === 'closed') {
            console.log('Creating new audio context (context was closed/null)');
            this.initialized = false; // Reset initialization flag
            await this.init();
        } else if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            } catch (error) {
                console.error('Failed to resume audio context:', error);
                // Try recreating the context if resume fails
                try {
                    console.log('Recreating audio context after resume failure');
                    this.audioContext = null;
                    this.initialized = false;
                    await this.init();
                } catch (recreateError) {
                    console.error('Failed to recreate audio context:', recreateError);
                    return false;
                }
            }
        }
        
        return this.initialized;
    }

    checkAudioContextHealth() {
        if (!this.audioContext) {
            console.log('Audio context health check: context is null');
            return false;
        }
        
        if (this.audioContext.state === 'closed') {
            console.log('Audio context health check: context is closed');
            return false;
        }
        
        if (this.audioContext.state === 'suspended') {
            console.log('Audio context health check: context is suspended');
            return false;
        }
        
        const isHealthy = this.audioContext.state === 'running' && this.initialized;
        console.log('Audio context health check:', isHealthy ? 'healthy' : 'unhealthy');
        return isHealthy;
    }
}