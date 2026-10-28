# VN-Editor

> **VN Video Editor (Web Edition)**  
> A desktop-grade, non-destructive web video editing suite inspired by VN Video Editor (VlogNow), built using HTML5 Canvas, WebGL, Web Audio API, WebCodecs, and a distributed FFmpeg rendering backend following the 112 Pillars of Production Web Architecture.

---

## ✨ Features

- **VN Signature UI & Dark Obsidian Theme**: Obsidian dark background (`#08090C`), frosted charcoal surfaces, and electric cyan neon accents (`#00F2FE`).
- **Aspect Ratio Freedom**: Switch seamlessly between `16:9` (YouTube/Landscape), `9:16` (TikTok/Reels/Shorts), `1:1` (Instagram), `4:5`, and `21:9` (UltraWide).
- **60 FPS Real-Time Canvas Preview**: Smooth playback with frame-accurate transport controls (`< 1F`, `1F >`, `|<`, `>|`) and timecode `HH:MM:SS:FF`.
- **VN Multi-Track Timeline**:
  - `[T]` Subtitle & Text Track (kinetic presets, typography styling)
  - `[P]` Picture-in-Picture & Overlay Track
  - `[V]` Main Video Track (with magnetic snap, razor split `Ctrl+B`, trim handles)
  - `[A]` Audio & Music Track (with **Beat Detection Markers** - "Edit to the Beat")
  - `[S]` Sound FX Track
- **Keyframe Diamond Engine (`◆`)**: Add keyframe markers for position, scale, rotation, and opacity with linear and cubic-bezier easing.
- **VN Bezier Speed Ramping**: Curve speed editor presets (*Montage*, *Hero*, *Bullet Time*, *Flash In*).
- **Color Grading & 3D LUTs**: Brightness, contrast, saturation, vignette, and LUT filters (*Teal & Orange*, *Cyberpunk*, *Golden Hour*, *Noir*).
- **Hybrid Export Pipeline**:
  - ⚡ **Instant Local Export**: WebCodecs GPU-accelerated export directly in the browser.
  - 🚀 **Server Production FFmpeg Queue**: Asynchronous render queue with real-time WebSocket progress telemetry.
- **Pro Keyboard Shortcuts**: Full cheatsheet modal (`?` key) with `Space`, `J-K-L`, `Ctrl+B`, `Ctrl+Z`, `Del`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Zustand, Lucide Icons, Canvas Confetti, Web Audio API, WebCodecs.
- **Backend**: Node.js, Express, TypeScript, FFmpeg (`fluent-ffmpeg`), WebSockets (`ws`), Multer, Helmet, Rate Limiter.
- **Architecture**: 112 Pillars of Web Production (Tiered caching, circuit breakers, idempotency, structured logging with trace IDs, health checks).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+) & npm

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend API starts at `http://localhost:5000/api/v1` and WebSocket at `ws://localhost:5000/ws/render`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 📄 License
MIT
