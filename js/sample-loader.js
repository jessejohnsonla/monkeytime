class SampleLoader {
    constructor() {
        this.manifest = null;
        // Fallback manifest in case fetch fails
        this.fallbackManifest = {
            "folders": {
                "Lead Sounds": [
                    "Arp_Odyssey_Lead_1.wav",
                    "Arp_Odyssey_Lead_2.wav",
                    "Arp_Odyssey_Lead_3.wav",
                    "Arp_Odyssey_Lead_4.wav",
                    "Arp_Odyssey_Lead_5.wav",
                    "Arp_Odyssey_Lead_6.wav",
                    "Roland_SH09_Lead_1.wav",
                    "Roland_SH09_Lead_2.wav",
                    "Roland_SH09_Lead_3.wav",
                    "Roland_SH09_Lead_4.wav",
                    "Roland_SH09_Lead_5.wav",
                    "Roland_SH09_Lead_6.wav",
                    "Roland_SH09_Lead_7.wav",
                    "Roland_SH09_Lead_8.wav",
                    "Teisco_60F_Lead_1.wav",
                    "Teisco_60F_Lead_2.wav",
                    "Teisco_60F_Lead_3.wav",
                    "Teisco_60F_Lead_4.wav",
                    "Teisco_60F_Lead_5.wav",
                    "Teisco_60F_Lead_6.wav",
                    "Teisco_60F_Lead_7.wav",
                    "Teisco_60F_Lead_8.wav"
                ]
            }
        };
    }

    async loadManifest() {
        try {
            const response = await fetch('assets/manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.manifest = await response.json();
            console.log('Loaded manifest from file');
            return this.manifest;
        } catch (error) {
            console.warn('Failed to load sample manifest, using fallback:', error);
            this.manifest = this.fallbackManifest;
            return this.manifest;
        }
    }

    generateSampleOptions() {
        if (!this.manifest) return '';

        let optionsHtml = '<option value="default">Default Piano</option>';
        
        for (const [folderName, files] of Object.entries(this.manifest.folders)) {
            optionsHtml += `<optgroup label="${folderName}">`;
            
            files.forEach(filename => {
                const displayName = this.formatDisplayName(filename);
                const filePath = `assets/AJ1_Sounds and FX Wavs/${folderName}/${filename}`;
                optionsHtml += `<option value="${filePath}">${displayName}</option>`;
            });
            
            optionsHtml += '</optgroup>';
        }
        
        return optionsHtml;
    }

    formatDisplayName(filename) {
        // Remove file extension and format for display
        return filename
            .replace('.wav', '')
            .replace(/_/g, ' ')
            .replace(/AJ1_/g, '')
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capitals
            .trim();
    }

    async populateSelector(selectorId) {
        await this.loadManifest();
        const selector = document.getElementById(selectorId);
        if (selector && this.manifest) {
            selector.innerHTML = this.generateSampleOptions();
            console.log('Sample selector populated with', Object.keys(this.manifest.folders).length, 'categories');
        }
    }
}