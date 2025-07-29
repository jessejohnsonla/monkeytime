class ChordLibrary {
    constructor() {
        this.CHORD_DEFINITIONS = {
            'Major': [0, 4, 7],
            'minor': [0, 3, 7],
            '7': [0, 4, 7, 10],
            'm7': [0, 3, 7, 10],
            'maj7': [0, 4, 7, 11],
            '9': [0, 4, 7, 10, 14],
            'm9': [0, 3, 7, 10, 14],
            'maj9': [0, 4, 7, 11, 14],
            '11': [0, 4, 7, 10, 14, 17],
            'm11': [0, 3, 7, 10, 14, 17],
            '13': [0, 4, 7, 10, 14, 17, 21],
            'm13': [0, 3, 7, 10, 14, 17, 21],
            'dim': [0, 3, 6],
            'dim7': [0, 3, 6, 9],
            'aug': [0, 4, 8],
            'sus2': [0, 2, 7],
            'sus4': [0, 5, 7],
            'add9': [0, 4, 7, 14]
        };

        this.NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        this.PIANO_KEY_TO_MIDI = {
            'C': 60,   // C4
            'C#': 61,
            'D': 62,
            'D#': 63,
            'E': 64,
            'F': 65,
            'F#': 66,
            'G': 67,
            'G#': 68,
            'A': 69,
            'A#': 70,
            'B': 71
        };
    }

    getChordNotes(rootNote, chordType, octave = 0) {
        if (!this.CHORD_DEFINITIONS[chordType]) {
            console.error(`Unknown chord type: ${chordType}`);
            return [];
        }

        const rootMidi = typeof rootNote === 'string' 
            ? this.PIANO_KEY_TO_MIDI[rootNote] 
            : rootNote;

        if (rootMidi === undefined) {
            console.error(`Invalid root note: ${rootNote}`);
            return [];
        }

        const intervals = this.CHORD_DEFINITIONS[chordType];
        const octaveOffset = octave * 12;

        return intervals.map(interval => rootMidi + interval + octaveOffset);
    }

    getChordName(rootNote, chordType) {
        const rootName = typeof rootNote === 'string' 
            ? rootNote 
            : this.NOTE_NAMES[rootNote % 12];
        
        return `${rootName} ${chordType}`;
    }

    getChordInfo(rootNote, chordType, octave = 0) {
        const chordNotes = this.getChordNotes(rootNote, chordType, octave);
        const chordName = this.getChordName(rootNote, chordType);
        
        const noteNames = chordNotes.map(midi => {
            return this.NOTE_NAMES[midi % 12];
        });

        return {
            name: chordName,
            notes: chordNotes,
            noteNames: noteNames.join(' - ')
        };
    }

    getAllChordTypes() {
        return Object.keys(this.CHORD_DEFINITIONS);
    }

    isValidChordType(chordType) {
        return this.CHORD_DEFINITIONS.hasOwnProperty(chordType);
    }

    getNoteFromMidi(midiNote) {
        return this.NOTE_NAMES[midiNote % 12];
    }

    getMidiFromNoteName(noteName) {
        return this.PIANO_KEY_TO_MIDI[noteName];
    }

    getKeyboardRange(rootNote = 'C', chordType = 'Major') {
        // Dynamic range that shows exactly 14 white keys, adjusted to show full chord
        const WHITE_KEYS_COUNT = 14;
        
        // Get chord notes at octave 0 for range calculation
        const chordNotes = this.getChordNotes(rootNote, chordType, 0);
        
        if (chordNotes.length === 0) {
            // Fallback: C4 + 14 white keys (2 octaves)
            return {
                lowest: 60,  // C4
                highest: 83  // B5 (14 white keys from C4)
            };
        }
        
        const minChordNote = Math.min(...chordNotes);
        const maxChordNote = Math.max(...chordNotes);
        
        // Find a starting white key that will show all chord notes within 14 white keys
        // Start from a white key at or before the lowest chord note
        let startWhiteKey = this.findNearestWhiteKeyAtOrBelow(minChordNote);
        
        // Calculate the range that includes 14 white keys from the start
        const endNote = this.findNthWhiteKeyFrom(startWhiteKey, WHITE_KEYS_COUNT - 1);
        
        // Ensure the highest chord note fits within this range
        if (maxChordNote > endNote) {
            // Shift the range to accommodate the highest chord note
            const newEndNote = Math.max(endNote, maxChordNote);
            startWhiteKey = this.findNthWhiteKeyFrom(newEndNote, -(WHITE_KEYS_COUNT - 1));
        }
        
        const finalEndNote = this.findNthWhiteKeyFrom(startWhiteKey, WHITE_KEYS_COUNT - 1);
        
        return {
            lowest: startWhiteKey,
            highest: finalEndNote
        };
    }
    
    findNearestWhiteKeyAtOrBelow(midiNote) {
        for (let note = midiNote; note >= 0; note--) {
            const noteName = this.NOTE_NAMES[note % 12];
            if (!noteName.includes('#')) {
                return note;
            }
        }
        return 60; // Fallback to C4
    }
    
    findNthWhiteKeyFrom(startNote, n) {
        let currentNote = startNote;
        let whiteKeysFound = 0;
        
        if (n === 0) return startNote;
        
        const direction = n > 0 ? 1 : -1;
        const targetCount = Math.abs(n);
        
        while (whiteKeysFound < targetCount && currentNote >= 0 && currentNote <= 127) {
            currentNote += direction;
            const noteName = this.NOTE_NAMES[currentNote % 12];
            if (!noteName.includes('#')) {
                whiteKeysFound++;
            }
        }
        
        return currentNote;
    }

    getPianoKeys(rootNote = 'C', chordType = 'Major') {
        const keys = [];
        const range = this.getKeyboardRange(rootNote, chordType);
        
        for (let midi = range.lowest; midi <= range.highest; midi++) {
            const noteName = this.NOTE_NAMES[midi % 12];
            const noteOctave = Math.floor(midi / 12) - 1;
            const isBlackKey = noteName.includes('#');
            
            keys.push({
                midi: midi,
                noteName: noteName,
                fullName: `${noteName}${noteOctave}`,
                isBlackKey: isBlackKey
            });
        }
        
        return keys;
    }
}