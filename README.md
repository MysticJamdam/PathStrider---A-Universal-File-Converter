# PathStrider

PathStrider is a lightweight desktop file conversion utility built with Tauri, React, TypeScript, and Rust.

It supports:
- Image format conversion
- Image to PDF conversion
- PDF to image extraction
- PDF compression
- Batch processing
- Drag & drop file support

Designed to be fast, minimal, and fully offline.

---

# Features

## Image Conversion

Convert between:
- PNG
- JPG / JPEG
- WEBP

Supports batch conversion.

---

## Image → PDF

Combine multiple images into a single PDF.

Features:
- Batch image merging
- Custom output file name
- Drag & drop support

Powered by ImageMagick.

---

## PDF → Images

Extract PDF pages into PNG images.

Powered by ImageMagick + Ghostscript.

---

## PDF Compression

Compress PDFs using Ghostscript with multiple quality presets:

- Extreme Compression
- Very Small File
- Small Size
- Balanced
- High Quality

Supports:
- Image downsampling
- Font compression
- Duplicate image detection

---

## Modern Desktop UX

- Native desktop app
- Drag and drop support
- Custom output folder selection
- Toast notifications
- Batch processing
- No internet required

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tauri

## Backend

- Rust

## External Tools

- ImageMagick
- Ghostscript

---

# Installation

## Download Release

Go to the GitHub Releases section and download the latest installer.

Install normally on Windows.

---

# Development Setup

## Requirements

- Node.js
- Rust
- Tauri CLI

---

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/PathStrider.git
cd PathStrider
