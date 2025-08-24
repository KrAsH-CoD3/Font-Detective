# Font Detective 🕵️‍♂️

Font Detective is a powerful, client-side tool that analyzes the fonts installed on your device to generate a unique browser fingerprint. It's designed to demonstrate how websites can identify and track users based on their specific font configuration, raising awareness about digital privacy.

## 🌐 Live Demo

Visit [**Font-Detective**](https://krash-cod3.github.io/Font-Detective/) to analyze your browser's font fingerprint instantly.

## ✨ Core Features

- **Advanced Font Detection**: Utilizes a robust canvas-based measurement technique to accurately detect installed fonts.
- **Massive Font Library**: Scans against a comprehensive database of over **3,200 fonts**, including system fonts, popular web fonts (Google Fonts), and platform-specific variants.
- **Asynchronous Scanning**: Performs scans in non-blocking chunks to ensure the user interface remains smooth and responsive, even on lower-end devices.
- **Instant Fingerprint Generation**: Generates a unique SHA-256 hash from the list of detected fonts, providing a stable identifier.
- **Uniqueness Score**: Calculates a score from 0-100% to estimate how unique your font profile is. The higher the score, the more identifiable you are.
- **Modern, Responsive UI**: A sleek, dark-themed interface that provides real-time feedback, including a progress bar, a live list of detected fonts, and instant results.
- **Easy Data Export**: Copy the full list of detected fonts to your clipboard with a single click.

## ⚙️ How It Works

1.  **Font Probing**: The detection engine iterates through its extensive list of fonts. For each font, it renders a test string onto a hidden HTML5 `<canvas>` element. It then measures the width of the rendered text.
2.  **Baseline Comparison**: The width of the text rendered with the target font is compared against the width of the same string rendered with a generic `monospace` fallback font. If the widths are different, the font is confirmed to be present on the system.
3.  **Fingerprint Hashing**: After the scan completes, the list of detected fonts is alphabetized and concatenated into a single string. This string is then processed using the `SubtleCrypto` API to generate a secure SHA-256 hash, which serves as your unique font fingerprint.
4.  **Uniqueness Calculation**: A non-linear function maps the total number of detected fonts to a uniqueness score. This model gives diminishing returns, meaning the score grows more slowly as the font count increases, providing a more nuanced measure of identifiability.

## 📚 Font Database

The tool's effectiveness comes from its large and diverse font database, which is organized into several categories:

- **Popular Fonts**: Common system and design fonts.
- **Extended List**: A broad collection of less common fonts.
- **Google Fonts**: Over 900 fonts from the Google Fonts library.
- **Platform-Specific**: A massive list of over 1,600 fonts found on different operating systems (Windows, macOS, Linux).
- **Noto Fonts**: A collection of fonts from Google's Noto family, designed for broad language support.

## 🚀 Getting Started

1.  Clone this repository or download the source code.
2.  Open the `index.html` file in any modern web browser.
3.  Click the **"Start Scan"** button.
4.  Observe the results and see how unique your font fingerprint is!

## 🔒 Privacy Note

This tool is for educational and demonstrative purposes only. **It does not collect, store, or transmit any user data.** All analysis is performed locally in your browser. The generated fingerprint is ephemeral and is discarded when you close the page.
