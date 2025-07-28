class UIController {
    constructor() {
        this.elements = {
            chordName: document.getElementById('chordName'),
            chordNotes: document.getElementById('chordNotes'),
            chordType: document.getElementById('chordType'),
            octaveDown: document.getElementById('octaveDown'),
            octaveUp: document.getElementById('octaveUp'),
            octaveDisplay: document.getElementById('octaveDisplay'),
            sampleSelect: document.getElementById('sampleSelect'),
            sampleName: document.getElementById('sampleName')
        };
        
        this.currentOctave = -2;
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

        // Sample selector
        this.elements.sampleSelect.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            if (selectedValue === 'default') {
                this.elements.sampleName.textContent = 'Default piano sample loaded';
                if (this.callbacks.onSampleLoad) {
                    this.callbacks.onSampleLoad(null); // Use default
                }
            } else {
                this.loadSampleFromURL(selectedValue);
            }
        });

        // Touch-friendly button styling
        this.addTouchFeedback();
    }

    addTouchFeedback() {
        const buttons = [
            this.elements.octaveDown,
            this.elements.octaveUp
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
        if (!file) return;

        if (file.size === 0) {
            this.showError('iCloud file detected! Download it first in Files app.');
            return;
        }

        this.elements.sampleName.textContent = 'Loading...';
        
        try {
            const success = await this.callbacks.onSampleLoad(file);
            if (success) {
                this.elements.sampleName.textContent = file.name;
            } else {
                this.elements.sampleName.textContent = 'Load failed';
                this.showError('Failed to load sample');
            }
        } catch (error) {
            this.elements.sampleName.textContent = 'Load failed';
            this.showError('Error loading sample');
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

    setOctave(octave) {
        this.currentOctave = octave;
        this.updateOctaveDisplay();
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

    async loadSampleFromURL(url) {
        this.elements.sampleName.textContent = 'Loading...';
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            
            // Create a fake file object for compatibility
            const fileName = url.split('/').pop();
            const file = new File([arrayBuffer], fileName, { type: 'audio/wav' });
            
            if (this.callbacks.onSampleLoad) {
                const success = await this.callbacks.onSampleLoad(file);
                if (success) {
                    this.elements.sampleName.textContent = `Loaded: ${fileName}`;
                } else {
                    this.elements.sampleName.textContent = 'Failed to load';
                }
            }
        } catch (error) {
            this.elements.sampleName.textContent = 'Error loading sample';
            console.error('Sample load error:', error);
        }
    }

    // Initialize UI state
    initialize() {
        this.updateOctaveDisplay();
        this.elements.sampleName.textContent = 'Default piano sample loaded';
        
        // Set default sample selection in dropdown
        this.elements.sampleSelect.value = 'assets/AJ1_Sounds and FX Wavs/Lead Sounds/Arp_Odyssey_Lead_3.wav';
    }
}