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
            
            // Load samples dynamically
            try {
                await this.sampleLoader.populateSelector('sampleSelect');
            } catch (error) {
                console.error('Failed to load samples dynamically, using hardcoded fallback:', error);
                // Hardcoded fallback
                const selector = document.getElementById('sampleSelect');
                if (selector) {
                    selector.innerHTML = `
                        <option value="default">Default Piano</option>
                        <optgroup label="Lead Sounds">
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Arp_Odyssey_Lead_1.wav">Arp Odyssey Lead 1</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Arp_Odyssey_Lead_2.wav">Arp Odyssey Lead 2</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Arp_Odyssey_Lead_3.wav" selected>Arp Odyssey Lead 3</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Arp_Odyssey_Lead_4.wav">Arp Odyssey Lead 4</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Arp_Odyssey_Lead_5.wav">Arp Odyssey Lead 5</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Arp_Odyssey_Lead_6.wav">Arp Odyssey Lead 6</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_1.wav">Roland SH09 Lead 1</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_2.wav">Roland SH09 Lead 2</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_3.wav">Roland SH09 Lead 3</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_4.wav">Roland SH09 Lead 4</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_5.wav">Roland SH09 Lead 5</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_6.wav">Roland SH09 Lead 6</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_7.wav">Roland SH09 Lead 7</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Roland_SH09_Lead_8.wav">Roland SH09 Lead 8</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_1.wav">Teisco 60F Lead 1</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_2.wav">Teisco 60F Lead 2</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_3.wav">Teisco 60F Lead 3</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_4.wav">Teisco 60F Lead 4</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_5.wav">Teisco 60F Lead 5</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_6.wav">Teisco 60F Lead 6</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_7.wav">Teisco 60F Lead 7</option>
                            <option value="assets/AJ1_Sounds and FX Wavs/Lead Sounds/Teisco_60F_Lead_8.wav">Teisco 60F Lead 8</option>
                        </optgroup>
                    `;
                    console.log('Used hardcoded sample fallback');
                }
            }
            
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
            
            // Show message that audio will activate on first interaction
            this.uiController.showSuccess('Tap any key to activate audio');
            
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