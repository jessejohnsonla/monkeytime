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
        // Dynamic range that shows exactly 14 keys, adjusted to show full chord
        const KEYBOARD_SIZE = 14;
        
        // Get chord notes at octave 0 for range calculation
        const chordNotes = this.getChordNotes(rootNote, chordType, 0);
        
        if (chordNotes.length === 0) {
            // Fallback to C4-based range
            return {
                lowest: 60,
                highest: 60 + KEYBOARD_SIZE - 1
            };
        }
        
        const minChordNote = Math.min(...chordNotes);
        const maxChordNote = Math.max(...chordNotes);
        const chordSpan = maxChordNote - minChordNote;
        
        // Start from the lowest chord note, ensuring all 14 keys fit
        let startNote = minChordNote;
        
        // If chord span is less than 14, we can center it better
        if (chordSpan < KEYBOARD_SIZE - 1) {
            const extraKeys = KEYBOARD_SIZE - 1 - chordSpan;
            startNote = Math.max(36, minChordNote - Math.floor(extraKeys / 2)); // Don't go below C2
        }
        
        return {
            lowest: startNote,
            highest: startNote + KEYBOARD_SIZE - 1
        };
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