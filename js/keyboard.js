class KeyboardRenderer {
    constructor(canvasElement, chordLibrary) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.chordLibrary = chordLibrary;
        
        this.keys = this.chordLibrary.getPianoKeys();
        this.highlightedKeys = new Set();
        this.pressedKeys = new Set();
        
        this.keyWidth = 0;
        this.keyHeight = 0;
        this.blackKeyWidth = 0;
        this.blackKeyHeight = 0;
        
        this.onKeyPress = null;
        this.onKeyRelease = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.render();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        this.canvas.width = containerWidth;
        this.canvas.height = 200;
        
        const whiteKeys = this.keys.filter(key => !key.isBlackKey);
        this.keyWidth = containerWidth / whiteKeys.length;
        this.keyHeight = this.canvas.height;
        this.blackKeyWidth = this.keyWidth * 0.6;
        this.blackKeyHeight = this.keyHeight * 0.6;
    }

    setupEventListeners() {
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        this.setupCanvas();
        this.render();
    }

    getKeyFromCoordinates(x, y) {
        // Check black keys first (they're on top)
        for (let i = 0; i < this.keys.length; i++) {
            const key = this.keys[i];
            if (key.isBlackKey) {
                const rect = this.getBlackKeyRect(key);
                if (x >= rect.x && x <= rect.x + rect.width && 
                    y >= rect.y && y <= rect.y + rect.height) {
                    return key;
                }
            }
        }
        
        // Then check white keys
        const whiteKeys = this.keys.filter(key => !key.isBlackKey);
        const keyIndex = Math.floor(x / this.keyWidth);
        if (keyIndex >= 0 && keyIndex < whiteKeys.length) {
            return whiteKeys[keyIndex];
        }
        
        return null;
    }

    getBlackKeyRect(key) {
        const whiteKeys = this.keys.filter(k => !k.isBlackKey && k.midi < key.midi);
        const whiteKeyIndex = whiteKeys.length;
        
        const x = (whiteKeyIndex * this.keyWidth) - (this.blackKeyWidth / 2);
        const y = 0;
        
        return {
            x: x,
            y: y,
            width: this.blackKeyWidth,
            height: this.blackKeyHeight
        };
    }

    handleTouchStart(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        for (let touch of event.touches) {
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            const key = this.getKeyFromCoordinates(x, y);
            
            if (key && !this.pressedKeys.has(key.midi)) {
                this.pressedKeys.add(key.midi);
                if (this.onKeyPress) {
                    this.onKeyPress(key);
                }
            }
        }
        
        this.render();
    }

    handleTouchEnd(event) {
        event.preventDefault();
        
        // Clear all pressed keys on touch end
        this.pressedKeys.clear();
        this.render();
    }

    handleTouchMove(event) {
        event.preventDefault();
        // Prevent scrolling while touching the keyboard
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        const key = this.getKeyFromCoordinates(x, y);
        
        if (key && !this.pressedKeys.has(key.midi)) {
            this.pressedKeys.add(key.midi);
            if (this.onKeyPress) {
                this.onKeyPress(key);
            }
            this.render();
        }
    }

    handleMouseUp(event) {
        this.pressedKeys.clear();
        this.render();
    }

    handleMouseLeave(event) {
        this.pressedKeys.clear();
        this.render();
    }

    highlightChord(midiNotes) {
        this.highlightedKeys.clear();
        midiNotes.forEach(midi => this.highlightedKeys.add(midi));
        this.render();
    }

    clearHighlights() {
        this.highlightedKeys.clear();
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw white keys first
        this.renderWhiteKeys();
        
        // Draw black keys on top
        this.renderBlackKeys();
    }

    renderWhiteKeys() {
        const whiteKeys = this.keys.filter(key => !key.isBlackKey);
        
        whiteKeys.forEach((key, index) => {
            const x = index * this.keyWidth;
            const y = 0;
            
            // Determine key color
            let fillColor = '#ffffff';
            if (this.pressedKeys.has(key.midi)) {
                fillColor = '#cccccc';
            } else if (this.highlightedKeys.has(key.midi)) {
                fillColor = '#e3f2fd';
            }
            
            // Fill key
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(x, y, this.keyWidth, this.keyHeight);
            
            // Draw border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, this.keyWidth, this.keyHeight);
            
            // Draw note name at bottom
            this.ctx.fillStyle = '#666666';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                key.noteName, 
                x + this.keyWidth / 2, 
                this.keyHeight - 10
            );
        });
    }

    renderBlackKeys() {
        const blackKeys = this.keys.filter(key => key.isBlackKey);
        
        blackKeys.forEach(key => {
            const rect = this.getBlackKeyRect(key);
            
            // Determine key color
            let fillColor = '#333333';
            if (this.pressedKeys.has(key.midi)) {
                fillColor = '#666666';
            } else if (this.highlightedKeys.has(key.midi)) {
                fillColor = '#1976d2';
            }
            
            // Fill key
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            
            // Draw border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        });
    }

    setKeyPressCallback(callback) {
        this.onKeyPress = callback;
    }

    setKeyReleaseCallback(callback) {
        this.onKeyRelease = callback;
    }

    // Keyboard range is now static - no need to update visually
}