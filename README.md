# Sort Youtube Playlist By Duration

A userscript that lets you sort any YouTube playlist by video duration (shortest to longest or longest to shortest).

## Features

- Automatically sorts YouTube playlists by video duration
- Toggle between sorting by shortest or longest videos
- Adaptive performance based on playlist size
- Modern UI with status indicators and controls

## Installation

1. Install a userscript manager extension:
   - [ViolentMonkey](https://violentmonkey.github.io/) (recommended)
   - [TamperMonkey](https://www.tampermonkey.net/)
   - [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
   
2. Add the script through your userscript manager.

## Usage

1. Navigate to any YouTube playlist
2. The sort controls will appear above the playlist 
3. Select your preferred sort order (shortest/longest)
4. Click "Sort Videos" to begin sorting
5. Wait for the process to complete

## Contributing

Contributors welcome! There are edge cases I cannot handle quickly especially in non-Chromium engines.

My setup is ViolentMonkey on Chromium. Volunteers are encouraged to test on alternative platforms.

If you'd like to contribute:
1. Fork the repository
2. Create your feature branch
3. Submit a pull request

## Known Issues

### TamperMonkey 5.1.0, Chrome Canary 124

If you experience issues with this combination, try one of these solutions:
1. Go to TM settings, change from Novice to Advanced, scroll down to Experimental and **switch Inject mode to Instant**
2. Go to [Chrome Experiments](chrome://flags/), enable `Enable (deprecated) synchronous mutation events` and restart Chrome.
3. Reinstall Chrome completely, removing previous browsing data

### Large Playlists

For very large playlists (500+ videos), sorting may take a while and could be resource-intensive. The script uses adaptive delays to balance performance and reliability.

## License

GPL-2.0
