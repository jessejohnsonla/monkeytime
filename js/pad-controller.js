class PadController {
    constructor(chordLibrary) {
        this.chordLibrary = chordLibrary;
        this.pads = document.querySelectorAll('.pad');
        this.onPadPress = null;
        this.pressedPads = new Set();
        this.highlightedPads = new Set();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.pads.forEach((pad, index) => {
            // Touch events
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handlePadPress(pad, index);
            }, { passive: false });

            pad.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handlePadRelease(pad, index);
            }, { passive: false });

            // Mouse events for desktop testing
            pad.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handlePadPress(pad, index);
            });

            pad.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handlePadRelease(pad, index);
            });

            pad.addEventListener('mouseleave', (e) => {
                this.handlePadRelease(pad, index);
            });
        });
    }

    handlePadPress(pad, padIndex) {
        if (this.pressedPads.has(padIndex)) return;
        
        this.pressedPads.add(padIndex);
        pad.classList.add('pressed');
        
        // Calculate the note based on pad position in chromatic scale
        const noteOffset = padIndex; // 0-11 for C through B
        const baseMidi = 60; // C4
        const midi = baseMidi + noteOffset;
        const noteName = this.chordLibrary.NOTE_NAMES[noteOffset];
        
        // Create a key object similar to keyboard
        const key = {
            midi: midi,
            noteName: noteName,
            fullName: `${noteName}4`,
            isBlackKey: noteName.includes('#')
        };
        
        if (this.onPadPress) {
            this.onPadPress(key);
        }
    }

    handlePadRelease(pad, padIndex) {
        if (!this.pressedPads.has(padIndex)) return;
        
        this.pressedPads.delete(padIndex);
        pad.classList.remove('pressed');
    }

    highlightChordPads(chordNotes) {
        // Clear previous highlights
        this.clearHighlights();
        
        // Convert MIDI notes to pad indices (chromatic scale from C)
        chordNotes.forEach(midi => {
            const noteIndex = (midi - 60) % 12; // Convert to 0-11 range
            if (noteIndex >= 0 && noteIndex < 12) {
                this.highlightedPads.add(noteIndex);
                const pad = this.pads[noteIndex];
                if (pad) {
                    pad.classList.add('highlighted');
                }
            }
        });
    }

    clearHighlights() {
        this.highlightedPads.clear();
        this.pads.forEach(pad => {
            pad.classList.remove('highlighted');
        });
    }

    setPadPressCallback(callback) {
        this.onPadPress = callback;
    }
}