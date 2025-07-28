class UIController {
    constructor() {
        this.elements = {
            chordName: document.getElementById('chordName'),
            chordNotes: document.getElementById('chordNotes'),
            chordType: document.getElementById('chordType'),
            octaveDown: document.getElementById('octaveDown'),
            octaveUp: document.getElementById('octaveUp'),
            octaveDisplay: document.getElementById('octaveDisplay'),
            loadSample: document.getElementById('loadSample'),
            sampleFile: document.getElementById('sampleFile'),
            sampleName: document.getElementById('sampleName')
        };
        
        this.currentOctave = 0;
        this.callbacks = {
            onChordTypeChange: null,
            onOctaveChange: null,
            onSampleLoad: null
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Chord type selector
        this.elements.chordType.addEventListener('change', (event) => {
            if (this.callbacks.onChordTypeChange) {
                this.callbacks.onChordTypeChange(event.target.value);
            }
        });

        // Octave controls
        this.elements.octaveDown.addEventListener('click', () => {
            this.changeOctave(-1);
        });

        this.elements.octaveUp.addEventListener('click', () => {
            this.changeOctave(1);
        });

        // Sample loading
        this.elements.loadSample.addEventListener('click', () => {
            this.elements.sampleFile.click();
        });

        this.elements.sampleFile.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.handleSampleLoad(file);
            }
        });

        // Touch-friendly button styling
        this.addTouchFeedback();
    }

    addTouchFeedback() {
        const buttons = [
            this.elements.octaveDown,
            this.elements.octaveUp,
            this.elements.loadSample
        ];

        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.backgroundColor = '#e0e0e0';
            });

            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.backgroundColor = '';
                }, 100);
            });
        });
    }

    changeOctave(direction) {
        const newOctave = this.currentOctave + direction;
        
        // Limit octave range
        if (newOctave >= -3 && newOctave <= 3) {
            this.currentOctave = newOctave;
            this.updateOctaveDisplay();
            
            if (this.callbacks.onOctaveChange) {
                this.callbacks.onOctaveChange(this.currentOctave);
            }
        }
    }

    updateOctaveDisplay() {
        const displayValue = this.currentOctave >= 0 ? `+${this.currentOctave}` : `${this.currentOctave}`;
        this.elements.octaveDisplay.textContent = displayValue;
    }

    updateChordDisplay(chordName, noteNames) {
        this.elements.chordName.textContent = chordName;
        this.elements.chordNotes.textContent = noteNames;
    }

    async handleSampleLoad(file) {
        // Validate file type
        if (!file.type.startsWith('audio/')) {
            this.showError('Please select an audio file');
            return;
        }

        // Validate file size (limit to 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File size too large. Please select a file smaller than 10MB');
            return;
        }

        try {
            // Update UI to show loading state
            this.elements.sampleName.textContent = 'Loading...';
            this.elements.loadSample.disabled = true;

            if (this.callbacks.onSampleLoad) {
                const success = await this.callbacks.onSampleLoad(file);
                
                if (success) {
                    this.elements.sampleName.textContent = file.name;
                    this.showSuccess('Sample loaded successfully');
                } else {
                    this.elements.sampleName.textContent = 'Load failed';
                    this.showError('Failed to load sample');
                }
            }
        } catch (error) {
            this.elements.sampleName.textContent = 'Load failed';
            this.showError('Error loading sample: ' + error.message);
        } finally {
            this.elements.loadSample.disabled = false;
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            zIndex: '1000',
            maxWidth: '90%',
            textAlign: 'center'
        });

        // Set background color based on type
        const colors = {
            error: '#f44336',
            success: '#4caf50',
            info: '#2196f3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    getCurrentChordType() {
        return this.elements.chordType.value;
    }

    getCurrentOctave() {
        return this.currentOctave;
    }

    setChordType(chordType) {
        this.elements.chordType.value = chordType;
    }

    // Callback setters
    onChordTypeChange(callback) {
        this.callbacks.onChordTypeChange = callback;
    }

    onOctaveChange(callback) {
        this.callbacks.onOctaveChange = callback;
    }

    onSampleLoad(callback) {
        this.callbacks.onSampleLoad = callback;
    }

    // Enable/disable UI elements
    setEnabled(enabled) {
        Object.values(this.elements).forEach(element => {
            if (element && element.disabled !== undefined) {
                element.disabled = !enabled;
            }
        });
    }

    // Initialize UI state
    initialize() {
        this.updateOctaveDisplay();
        this.elements.sampleName.textContent = 'No sample loaded';
    }
}