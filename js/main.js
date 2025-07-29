class ChordPlayerApp {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.chordLibrary = new ChordLibrary();
        this.keyboardRenderer = null;
        this.padController = null;
        this.uiController = new UIController();
        this.sampleLoader = new SampleLoader();
        
        this.currentRootNote = 'C';
        this.currentChordType = 'm9';
        this.currentOctave = -2;
        
        this.isInitialized = false;
    }

    async init() {
        try {
            // Initialize keyboard renderer (doesn't need audio context)
            const canvas = document.getElementById('keyboard');
            this.keyboardRenderer = new KeyboardRenderer(canvas, this.chordLibrary);
            
            // Initialize pad controller
            this.padController = new PadController(this.chordLibrary);
            
            // Update keyboard for initial chord
            this.keyboardRenderer.updateKeyboardForChord(this.currentRootNote, this.currentChordType);
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Initialize UI
            this.uiController.initialize();
            
            // Load samples dynamically

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
            
            // Show the audio activation modal
            this.showAudioModal();
            
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

        // Pad press handler
        this.padController.setPadPressCallback((key) => {
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
        document.addEventListener('keydown', this.activateAudioContext.bind(this), { once: true });
        document.addEventListener('change', this.activateAudioContext.bind(this), { once: true });
        document.addEventListener('mousedown', this.activateAudioContext.bind(this), { once: true });

        // Handle page visibility changes (iOS tab switching, phone sleep/wake)
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Handle focus/blur events as backup
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
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

    handleVisibilityChange() {
        if (document.hidden) {
            console.log('Page became hidden - audio context may be suspended');
        } else {
            console.log('Page became visible - checking audio context health');
            // Check audio health when page becomes visible again
            setTimeout(() => {
                if (this.audioEngine && !this.audioEngine.checkAudioContextHealth()) {
                    console.log('Audio context needs reactivation after visibility change');
                    // Don't auto-reactivate, wait for next user interaction
                }
            }, 100);
        }
    }

    handleWindowFocus() {
        console.log('Window focused - checking audio context health');
        setTimeout(() => {
            if (this.audioEngine && !this.audioEngine.checkAudioContextHealth()) {
                console.log('Audio context needs reactivation after window focus');
            }
        }, 100);
    }

    handleWindowBlur() {
        console.log('Window blurred - audio context may be suspended');
    }

    async handleKeyPress(key) {
        if (!this.isInitialized) return;

        // Ensure audio is activated
        if (!this.audioEngine.initialized) {
            await this.activateAudioContext();
        }

        // Use the pressed key as the root note
        this.currentRootNote = key.noteName;
        
        // Update keyboard to show the new chord
        this.keyboardRenderer.updateKeyboardForChord(this.currentRootNote, this.currentChordType);
        
        // Play the chord
        await this.playCurrentChord();
        
        // Update display and highlighting
        this.updateChordDisplay();
        this.highlightCurrentChord();
    }

    handleChordTypeChange(chordType) {
        this.currentChordType = chordType;
        
        // Update keyboard to show the new chord
        this.keyboardRenderer.updateKeyboardForChord(this.currentRootNote, this.currentChordType);
        
        this.updateChordDisplay();
        this.highlightCurrentChord();
    }

    handleOctaveChange(octave) {
        this.currentOctave = octave;
        
        // Keyboard is static - octave only affects sound, not visuals
        
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

    async playCurrentChord() {
        if (!this.isInitialized) {
            console.warn('App not initialized');
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
                
                // Play the new chord (this will auto-check and reactivate audio if needed)
                await this.audioEngine.playChord(chordNotes, 2.0);
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

        // Get chord notes at octave 0 for consistent highlighting position
        const chordNotes = this.chordLibrary.getChordNotes(
            this.currentRootNote,
            this.currentChordType,
            0  // Always use octave 0 for highlighting
        );

        this.keyboardRenderer.highlightChord(chordNotes);
        this.padController.highlightChordPads(chordNotes);
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

    showAudioModal() {
        const modal = document.getElementById('audioModal');
        const startButton = document.getElementById('startButton');
        
        if (modal && startButton) {
            // Show modal
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            console.log('Audio modal shown');
            
            startButton.addEventListener('click', async () => {
                console.log('Start button clicked');
                
                try {
                    // Activate audio context
                    console.log('Activating audio context...');
                    await this.activateAudioContext();
                    console.log('Audio context activated');
                    
                    // Hide modal completely
                    modal.classList.add('hidden');
                    
                    // Trigger the default sample load
                    setTimeout(() => {
                        const sampleSelect = document.getElementById('sampleSelect');
                        if (sampleSelect && sampleSelect.value !== 'default') {
                            console.log('Triggering sample load for:', sampleSelect.value);
                            const changeEvent = new Event('change', { bubbles: true });
                            sampleSelect.dispatchEvent(changeEvent);
                        }
                    }, 100);
                    
                } catch (error) {
                    console.error('Error in start button click:', error);
                }
            }, { once: true }); // Only allow one click
        } else {
            console.error('Modal or start button not found');
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.chordPlayer = new ChordPlayerApp();
    await window.chordPlayer.init();
});