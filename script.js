import { popularFonts, fontList, extendedFontList, googleFonts, notoFonts, platformFonts } from './fonts/fonts.js';

// Font Detection Engine
class FontDetector {
    constructor() {
                
        this.testFonts = [...new Set([
            ...fontList,
            ...notoFonts,
            ...googleFonts,
            ...popularFonts,
            ...platformFonts,
            ...extendedFontList
        ])];
            
        this.detectedFonts = [];
        this.isScanning = false;
        this.fingerprint = '';
        this.uniquenessScore = 0;
    }

    // High-level font detection using a more robust canvas measurement
    detectFont(fontName) {
        const testString = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()";
        const testSize = 72;
        // A generic baseline font that is highly unlikely to be the target font
        const baselineFont = 'monospace';

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return false;

        // 1. Measure the baseline font width
        context.font = `${testSize}px ${baselineFont}`;
        const baselineWidth = context.measureText(testString).width;

        // 2. Measure the target font width with the baseline as a fallback
        context.font = `${testSize}px "${fontName}", ${baselineFont}`;
        const testWidth = context.measureText(testString).width;

        // If the widths are different, the font is considered available.
        // This is more reliable than comparing against multiple, potentially similar fallbacks.
        return testWidth !== baselineWidth;
    }

    // Generate SHA-256 hash for fingerprint, with a fallback for non-secure contexts
    async generateHash(str) {
        if (window.crypto && window.crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(str);
                const hash = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hash));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
            } catch (error) {
                console.warn('Crypto API failed, falling back to simple hash.', error);
            }
        }

        // Simple hash fallback for HTTP or unsupported browsers
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return (hash >>> 0).toString(16).padStart(8, '0').substring(0, 16);
    }

    // Calculate uniqueness score based on font count
    calculateUniquenessScore(fontCount) {
        // A non-linear function to map font count to a 0-100 score.
        // This gives diminishing returns for each additional font, providing a more
        // nuanced uniqueness score. The curve is adjusted to make scores above 90 rare.
        const maxFonts = 200; // A reasonable upper bound for common systems
        const normalizedCount = Math.min(fontCount, maxFonts);
        
        // Use a power function to create a curve where uniqueness grows slower as font count increases
        const score = 100 * Math.pow(normalizedCount / maxFonts, 0.5);
        
        // Ensure score is within a sensible range (e.g., 5-99)
        return Math.min(99, Math.max(5, Math.round(score)));
    }

    // Main scanning function, optimized with async chunks
    async scan(onProgress, onComplete) {
        if (this.isScanning) return;
        
        this.isScanning = true;
        this.detectedFonts = [];
        
        const chunkSize = 10;
        let completedTests = 0;

        const processChunk = async (chunk) => {
            for (const font of chunk) {
                const isAvailable = this.detectFont(font);
                if (isAvailable) {
                    this.detectedFonts.push(font);
                    onProgress(this.detectedFonts.length, completedTests + 1, this.testFonts.length, font);
                }
                completedTests++;
            }
        };

        for (let i = 0; i < this.testFonts.length; i += chunkSize) {
            const chunk = this.testFonts.slice(i, i + chunkSize);
            await processChunk(chunk);
            // Yield to the main thread to keep UI responsive
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Generate fingerprint
        const fingerprintString = this.detectedFonts.sort().join('|');
        this.fingerprint = await this.generateHash(fingerprintString);
        this.uniquenessScore = this.calculateUniquenessScore(this.detectedFonts.length);
        
        this.isScanning = false;
        onComplete(this.detectedFonts, this.fingerprint, this.uniquenessScore);
    }

    reset() {
        this.detectedFonts = [];
        this.fingerprint = '';
        this.uniquenessScore = 0;
        this.isScanning = false;
    }
}

// UI Controller
class UIController {
    constructor() {
        this.fontDetector = new FontDetector();
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.scanBtn = document.getElementById('scanBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.scanText = document.getElementById('scanText');
        this.controls = this.scanBtn.parentElement;
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.fingerprintHash = document.getElementById('fingerprintHash');
        this.uniquenessScore = document.getElementById('uniquenessScore');
        this.uniquenessLabel = document.getElementById('uniquenessLabel');
        this.summaryText = document.getElementById('summaryText');
        this.fontsGrid = document.getElementById('fontsGrid');

        this.controls.classList.add('initial-state');
    }

    bindEvents() {
        this.scanBtn.addEventListener('click', () => this.startScan());
        this.resetBtn.addEventListener('click', () => this.resetScan());
        this.copyBtn.addEventListener('click', () => this.copyFonts());
    }

    startScan() {
        this.controls.classList.remove('initial-state');
        this.scanBtn.disabled = true;
        this.scanText.textContent = 'Scanning...';
        this.progressContainer.style.display = 'block';
        this.resultsContainer.style.display = 'block';
        this.resetBtn.style.display = 'none';
        this.copyBtn.style.display = 'none';
        this.copyBtn.classList.remove('is-visible');

        // Clear previous results
        this.fontsGrid.innerHTML = '';
        this.progressFill.style.width = '0%';
        this.fingerprintHash.textContent = '';
        this.uniquenessScore.textContent = '';
        this.uniquenessLabel.textContent = '';
        this.summaryText.innerHTML = '';

        this.fontDetector.scan(
            (detectedCount, completed, total, lastFont) => this.updateProgress(detectedCount, completed, total, lastFont),
            (fonts, fingerprint, score) => this.displayResults(fonts, fingerprint, score)
        );
    }

    updateProgress(detectedCount, completed, total, lastFont) {
        const progressPercent = (completed / total) * 100;
        this.progressFill.style.width = `${progressPercent}%`;
        this.progressText.textContent = `Probing system fonts... ${detectedCount} detected`;
        
        // Add font to grid immediately when detected
        this.addFontToGrid(lastFont, detectedCount - 1);
    }

    addFontToGrid(fontName, index) {
        const fontItem = document.createElement('div');
        fontItem.className = 'font-item';
        fontItem.style.animationDelay = `${index * 0.05}s`;
        
        fontItem.innerHTML = `
            <div class="font-name">${fontName}</div>
            <div class="font-preview" style="font-family: '${fontName}', sans-serif;">
                The quick brown fox jumps
            </div>
        `;
        
        this.fontsGrid.appendChild(fontItem);
    }

    displayResults(fonts, fingerprint, score) {
        // Update fingerprint display
        this.fingerprintHash.textContent = fingerprint;
        this.uniquenessScore.textContent = `${score}%`;
        
        // Update uniqueness label
        this.uniquenessLabel.textContent = score > 70 ? 'Highly Unique' : 'Moderately Unique';
        this.uniquenessLabel.className = `score-badge ${score > 70 ? 'high' : ''}`;
        
        // Update summary
        this.summaryText.innerHTML = `<strong>${fonts.length} fonts detected</strong> from ${this.fontDetector.testFonts.length} tested. This fingerprint can be used to track your device across websites.`;
        
        // Update controls
        this.scanBtn.disabled = false;
        this.scanText.textContent = 'Start Scan';
        this.progressContainer.style.display = 'none';
        this.resetBtn.style.display = 'inline-block';
        this.copyBtn.style.display = 'inline-flex';
        this.copyBtn.classList.add('is-visible');
        
        this.copyBtn.addEventListener('click', () => {
            const fontNames = Array.from(this.fontsGrid.children)
                .map(card => card.querySelector('.font-name').textContent)
                .join(', ');

            // Fallback for older browsers
            if (!navigator.clipboard) {
                const textarea = document.createElement('textarea');
                textarea.value = fontNames;
                textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in MS Edge.
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.showCopySuccess();
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(textarea);
                return;
            }

            navigator.clipboard.writeText(fontNames).then(() => this.showCopySuccess(), (err) => {
                console.error('Async: Could not copy text: ', err);
            });
        });
    }

    showCopySuccess() {
        const originalIcon = this.copyBtn.innerHTML;
        this.copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
            this.copyBtn.innerHTML = originalIcon;
        }, 2000);
    }

    copyFonts() {
        const fontListText = this.fontDetector.detectedFonts.join(', ');
        navigator.clipboard.writeText(fontListText).then(() => {
            const originalIcon = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
                this.copyBtn.innerHTML = originalIcon;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy fonts: ', err);
        });
    }

    resetScan() {
        this.fontDetector.reset();
        this.resultsContainer.style.display = 'none';
        this.resetBtn.style.display = 'none';
        this.copyBtn.style.display = 'none';
        this.copyBtn.classList.remove('is-visible');
        this.fontsGrid.innerHTML = '';
        this.progressFill.style.width = '0%';
        this.controls.classList.add('initial-state');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});