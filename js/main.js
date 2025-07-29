class ChordPlayerApp {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.chordLibrary = new ChordLibrary();
        this.keyboardRenderer = null;
        this.uiController = new UIController();
        this.sampleLoader = new SampleLoader();
        
        this.currentRootNote = 'C';
        this.currentChordType = 'm11';
        this.currentOctave = -2;
        
        this.isInitialized = false;
    }

    async init() {
        try {
            // Initialize keyboard renderer (doesn't need audio context)
            const canvas = document.getElementById('keyboard');
            this.keyboardRenderer = new KeyboardRenderer(canvas, this.chordLibrary);
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Initialize UI
            this.uiController.initialize();
            
            // Samples are hardcoded in HTML - no dynamic loading needed
            
            // Set default values in UI
            this.uiController.setChordType(this.currentChordType);
            this.uiController.setOctave(this.currentOctave);
            
            // Update initial display
            this.updateChordDisplay();
            this.highlightCurrentChord();
            
            // Trigger the pre-selected sample to load
            setTimeout(() => {
                const sampleSelect = document.getElementById('sampleSelect');
                console.log('Dropdown value on load:', sampleSelect.value);
                console.log('Selected option text:', sampleSelect.options[sampleSelect.selectedIndex].text);
                
                if (sampleSelect.value !== 'default') {
                    console.log('Triggering change event for:', sampleSelect.value);
                    const changeEvent = new Event('change', { bubbles: true });
                    sampleSelect.dispatchEvent(changeEvent);
                } else {
                    console.log('Dropdown is still on default, not triggering change');
                }
            }, 100);
            
            this.isInitialized = true;
            console.log('Chord Player initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Chord Player:', error);
            this.showError('Failed to initialize application');
        }
    }

    setupEventHandlers() {
        // Keyboard key press handler
        this.keyboardRenderer.setKeyPressCallback((key) => {
            this.handleKeyPress(key);
        });

        // UI event handlers
        this.uiController.onChordTypeChange((chordType) => {
            this.handleChordTypeChange(chordType);
        });

        this.uiController.onOctaveChange((octave) => {
            this.handleOctaveChange(octave);
        });

        this.uiController.onSampleLoad(async (file) => {
            return await this.handleSampleLoad(file);
        });

        // Handle audio context activation on first user interaction
        document.addEventListener('touchstart', this.activateAudioContext.bind(this), { once: true });
        document.addEventListener('click', this.activateAudioContext.bind(this), { once: true });
    }

    async activateAudioContext() {
        try {
            const success = await this.audioEngine.activateAudioContext();
            if (success) {
                console.log('Audio context activated successfully');
            } else {
                console.warn('Audio context activation failed');
            }
        } catch (error) {
            console.error('Failed to activate audio context:', error);
        }
    }

    async handleKeyPress(key) {
        if (!this.isInitialized) return;

        // Ensure audio is activated
        if (!this.audioEngine.initialized) {
            await this.activateAudioContext();
        }

        // Use the pressed key as the root note
        this.currentRootNote = key.noteName;
        
        // Play the chord
        this.playCurrentChord();
        
        // Update display and highlighting
        this.updateChordDisplay();
        this.highlightCurrentChord();
    }

    handleChordTypeChange(chordType) {
        this.currentChordType = chordType;
        this.updateChordDisplay();
        this.highlightCurrentChord();
    }

    handleOctaveChange(octave) {
        this.currentOctave = octave;
        this.highlightCurrentChord();
    }

    async handleSampleLoad(file) {
        try {
            // Ensure audio context is activated
            if (!this.audioEngine.initialized) {
                await this.activateAudioContext();
            }
            
            if (file === null) {
                // Using default sample - audio engine already has one
                console.log('Using default piano sample');
                return true;
            }
            
            const success = await this.audioEngine.loadSample(file);
            if (success) {
                console.log('Sample loaded:', file.name);
                this.uiController.showSuccess(`Loaded: ${file.name}`);
            } else {
                this.uiController.showError('Failed to load sample');
            }
            return success;
        } catch (error) {
            console.error('Failed to load sample:', error);
            this.uiController.showError('Error loading sample');
            return false;
        }
    }

    playCurrentChord() {
        if (!this.isInitialized) {
            console.warn('App not initialized');
            return;
        }

        if (!this.audioEngine.initialized) {
            console.warn('Audio engine not initialized');
            return;
        }

        try {
            const chordNotes = this.chordLibrary.getChordNotes(
                this.currentRootNote,
                this.currentChordType,
                this.currentOctave
            );

            console.log('Playing chord:', this.currentRootNote, this.currentChordType, 'Notes:', chordNotes);

            if (chordNotes.length > 0) {
                // Stop any currently playing notes
                this.audioEngine.stopAllNotes();
                
                // Play the new chord
                this.audioEngine.playChord(chordNotes, 2.0);
            }
        } catch (error) {
            console.error('Failed to play chord:', error);
            this.showError('Failed to play chord');
        }
    }

    updateChordDisplay() {
        const chordInfo = this.chordLibrary.getChordInfo(
            this.currentRootNote,
            this.currentChordType,
            this.currentOctave
        );

        this.uiController.updateChordDisplay(chordInfo.name, chordInfo.noteNames);
    }

    highlightCurrentChord() {
        if (!this.keyboardRenderer) return;

        const chordNotes = this.chordLibrary.getChordNotes(
            this.currentRootNote,
            this.currentChordType,
            this.currentOctave
        );

        this.keyboardRenderer.highlightChord(chordNotes);
    }

    showError(message) {
        this.uiController.showError(message);
    }

    showSuccess(message) {
        this.uiController.showSuccess(message);
    }

    // Public methods for external control
    setChord(rootNote, chordType, octave = 0) {
        this.currentRootNote = rootNote;
        this.currentChordType = chordType;
        this.currentOctave = octave;
        
        this.uiController.setChordType(chordType);
        this.updateChordDisplay();
        this.highlightCurrentChord();
    }

    playChord(rootNote = null, chordType = null, octave = null) {
        if (rootNote) this.currentRootNote = rootNote;
        if (chordType) this.currentChordType = chordType;
        if (octave !== null) this.currentOctave = octave;
        
        this.playCurrentChord();
        this.updateChordDisplay();
        this.highlightCurrentChord();
    }

    stopAllSounds() {
        this.audioEngine.stopAllNotes();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.chordPlayer = new ChordPlayerApp();
    await window.chordPlayer.init();
});