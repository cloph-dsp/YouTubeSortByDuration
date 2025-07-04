# 🔀 YouTubeSortByDuration 🚀

**Forked from [KohGeek/SortYoutubePlaylistByDuration](https://github.com/KohGeek/SortYoutubePlaylistByDuration)** — improved UI, speed, and compatibility.

[![ViolentMonkey Compatible](https://img.shields.io/badge/ViolentMonkey-OK-brightgreen)](https://violentmonkey.github.io/)
[![Tampermonkey Compatible](https://img.shields.io/badge/Tampermonkey-OK-blue)](https://www.tampermonkey.net/)
[![Install from Greasy Fork](https://img.shields.io/badge/Install%20from-Greasy%20Fork-darkgreen.svg)](https://greasyfork.org/en/scripts/530129-yt-playlist-sorter)
[![GPL-2.0 License](https://img.shields.io/badge/License-GPL%202.0-blue.svg)](LICENSE)

## Overview

YouTubeSortByDuration is the ultimate YouTube userscript that supercharges your playlist management by sorting videos by duration. Choose fastest-to-slowest or vice versa and watch your playlist get optimized instantly! ⚡

---

## ✨ Key Features

- 🎬 Sort playlists by video length: shortest-to-longest or longest-to-shortest
- 🛠️ Blazing-fast reordering engine with adaptive delays
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

---

❤️ **Contributing**

Contributions, bug reports, and feature requests are welcome! Please fork the repo, create a feature branch, and open a pull request.

---

⚠️ **Known Issues**

- **Tampermonkey 5.1.0 & Chrome Canary 124**: If you encounter issues, set Inject Mode to *Instant* and enable synchronous mutation events.
- **Large Playlists (500+ videos)**: Sorting may take longer due to adaptive delays for reliability.