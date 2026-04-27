# 🔀 YouTubeSortByDuration 🚀

**Forked from [KohGeek/SortYoutubePlaylistByDuration](https://github.com/KohGeek/SortYoutubePlaylistByDuration)** — complete rewrite using YouTube's InnerTube API.

[![ViolentMonkey Compatible](https://img.shields.io/badge/ViolentMonkey-OK-brightgreen)](https://violentmonkey.github.io/)
[![Tampermonkey Compatible](https://img.shields.io/badge/Tampermonkey-OK-blue)](https://www.tampermonkey.net/)
[![Install from Greasy Fork](https://img.shields.io/badge/Install%20from-Greasy%20Fork-darkgreen.svg)](https://greasyfork.org/en/scripts/530129-yt-playlist-sorter)
[![GPL-2.0 License](https://img.shields.io/badge/License-GPL%202.0-blue.svg)](LICENSE)

## Overview

YouTubeSortByDuration sorts YouTube playlists by video duration using YouTube's own InnerTube API — no unreliable DOM drag-and-drop simulation. Works on playlists of any size. ⚡

---

## ✨ Key Features

- 🎬 Sort playlists by video length: shortest-to-longest or longest-to-shortest
- ⚡ **YouTube InnerTube API** — no broken drag-and-drop, fast and reliable
- 🎨 Sleek, modern UI with intuitive controls and live status updates
- 🌐 Broad compatibility: Works on all YouTube playlist types and browsers
- 🚀 Lightweight & open-source: Zero dependencies, GPL-2.0 licensed

---

## 📦 Installation

1. Install a userscript manager like [ViolentMonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/).
2. Install the script from **[Greasy Fork](https://greasyfork.org/en/scripts/530129-yt-playlist-sorter)**.
3. Open a YouTube playlist, and the sort controls will appear automatically.

---

## 🚀 Usage

1. Open a YouTube playlist.
2. Select a sort order (`by Longest` or `by Shortest`).
3. Click **Sort Videos** to begin.
4. The page will reload when sorting is complete.

---

## 🛠 Technical Details

Version 6.0 replaced the broken DOM drag-and-drop approach with YouTube's `youtubei/v1/browse/edit_playlist` API:

- **`ACTION_MOVE_VIDEO_AFTER`** — moves videos to their correct positions
- **`SAPISIDHASH` authentication** — uses your session cookie to authorize requests
- **`ytInitialData` parsing** — extracts `setVideoId` identifiers from YouTube's page data
- **Virtual array tracking** — tracks order in memory (DOM doesn't reflect API changes until reload)

---

❤️ **Contributing**

Contributions, bug reports, and feature requests are welcome! Please fork the repo, create a feature branch, and open a pull request.