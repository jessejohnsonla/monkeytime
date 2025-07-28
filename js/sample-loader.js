class SampleLoader {
    constructor() {
        this.manifest = null;
    }

    async loadManifest() {
        try {
            const response = await fetch('assets/manifest.json');
            this.manifest = await response.json();
            return this.manifest;
        } catch (error) {
            console.error('Failed to load sample manifest:', error);
            return null;
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