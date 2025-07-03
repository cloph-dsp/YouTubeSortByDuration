# Sort YouTube Playlist By Duration

This is a userscript for sorting any YouTube playlist by video duration (either shortest-to-longest or longest-to-shortest).  
**This project is a fork of [KohGeek/SortYoutubePlaylistByDuration](https://github.com/KohGeek/SortYoutubePlaylistByDuration),** with various improvements in UI, reordering speed, and broader compatibility to ensure it works on all playlists.

## Features

- Sorts YouTube playlists by video length
- Switch between ascending or descending order
- Enhanced UI with clear controls and status feedback
- Optimized for faster sorting, even on large playlists
- Designed to work reliably across all types of playlists

## Installation

1. Install a userscript manager:
   - [ViolentMonkey](https://violentmonkey.github.io/) (recommended)
   - [TamperMonkey](https://www.tampermonkey.net/)
   - [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
2. Add this script to your userscript manager.

## Usage

1. Open any YouTube playlist
2. The sorting controls will appear above the playlist
3. Choose your preferred sort order (shortest or longest first)
4. Click "Sort Videos" to start
5. Sit back and wait for the sorting to finish

## Contributing

Contributions are welcome! There are still edge cases, especially on non-Chromium browsers, that need attention.

My main setup is ViolentMonkey on Chromium, but testing and fixes for other platforms are appreciated.

To contribute:
1. Fork this repository
2. Create a feature branch
3. Open a pull request

## Known Issues

### TamperMonkey 5.1.0, Chrome Canary 124

If you run into problems with this setup, try:
1. In TamperMonkey settings, switch from Novice to Advanced, scroll to Experimental, and set **Inject mode to Instant**
2. In [Chrome Experiments](chrome://flags/), enable `Enable (deprecated) synchronous mutation events` and restart Chrome
3. Fully reinstall Chrome, clearing all browsing data

### Large Playlists

Sorting very large playlists (500+ videos) may take longer and use more resources. The script uses adaptive delays to help balance speed and reliability.

## License

GPL-2.0

