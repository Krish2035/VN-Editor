# VNEditor — Professional Web Video Editor (Live on Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKrish2035%2FVN-Editor)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-00F2FE?style=for-the-badge&logo=vercel)](https://vn-editor-eight.vercel.app)
[![Architecture: 112 Pillars](https://img.shields.io/badge/Architecture-112%20Pillars-8A2387?style=for-the-badge)](IMPLEMENTATION_PLAN.md)

> 🎬 **VNEditor (Web Edition)**: A high-performance, non-destructive web video editing suite inspired by VN Video Editor (VlogNow).  
> Deployed seamlessly on **Vercel** (Frontend SPA) and **Render** (Backend API & FFmpeg Worker) with **Neon Serverless PostgreSQL**.

---

## 🌐 Live Web Studio

- **Official Vercel Deployment**: [https://vn-editor-eight.vercel.app](https://vn-editor-eight.vercel.app)
- **API & Telemetry Gateway**: Hosted on Render (`https://vn-editor-backend.onrender.com`)

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
- **VN Bezier Speed Ramping**: Curve speed editor presets (_Montage_, _Hero_, _Bullet Time_, _Flash In_).
- **Color Grading & 3D LUTs**: Brightness, contrast, saturation, vignette, and LUT filters (_Teal & Orange_, _Cyberpunk_, _Golden Hour_, _Noir_).
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
