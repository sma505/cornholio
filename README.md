# CORNHOLIO - Cornhole Tournament Manager

A fun, vibe-coded webapp for running cornhole tournaments with your friends. Built for personal use at BBQs, tailgates, and backyard throwdowns.

Themed after Beavis and Butt-Head's legendary alter ego — because every cornhole tournament needs a little Cornholio energy.

## Features

- **Multiple tournament formats**: Round Robin, Group + Playoff, Single Elimination, Double Elimination
- **Two game modes**: Standard (play to 21) and Quick (fixed frames, count points)
- **Best-of series**: Configurable per stage (Bo1/Bo3/Bo5 for playoffs and finals)
- **Frame-by-frame scoring**: Enter raw points per frame with live cancellation scoring
- **Drag-and-drop team pairing**: Shuffle randomly or pair manually
- **Draw support**: Quick mode allows draws in group stages with football-style points (3W/1D/0L)
- **Multiple tournaments**: Create, name, and manage multiple tournaments
- **Works offline**: All data stored in your browser — no account needed
- **Mobile-friendly**: Responsive design, works on phone or laptop

## Tech Stack

Svelte 5 + Vite + Tailwind CSS. No backend, no database — just a static site.

## Getting Started

```bash
# Clone and install
git clone https://github.com/sma505/cornholio.git
cd cornholio
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Requires Node.js 22+. On NixOS, just `direnv allow` and the flake handles it.

## Live Demo

[sma505.github.io/cornholio](https://sma505.github.io/cornholio/)

## About

This is a quick, vibe-coded fun project for personal use. Built with Claude Code in a single session. No tests, no CI, no guarantees — just vibes and cornhole.

---

*This is a fan project and is not affiliated with, endorsed by, or associated with Paramount, MTV, or the creators of Beavis and Butt-Head. "Beavis and Butt-Head" and "Cornholio" are trademarks of Paramount Global. All references are used for parody and personal entertainment purposes only.*
