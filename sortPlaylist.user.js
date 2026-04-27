// ==UserScript==
// @name              YouTubeSortByDuration
// @namespace         https://github.com/cloph-dsp/YouTubeSortByDuration
// @version           6.1
// @description       Supercharges your playlist management by sorting videos by duration with enhanced reliability for large playlists.
// @author            cloph-dsp, originally by KohGeek
// @license           GPL-2.0-only
// @homepageURL       https://github.com/cloph-dsp/YouTubeSortByDuration
// @supportURL        https://github.com/cloph-dsp/YouTubeSortByDuration/issues
// @match             http://*.youtube.com/*
// @match             https://*.youtube.com/*
// @require           https://greasyfork.org/scripts/374849-library-onelementready-es7/code/Library%20%7C%20onElementReady%20ES7.js
// @grant             none
// @run-at            document-start
// ==/UserScript==

/* global onElementReady */

// v6.0 - YouTube InnerTube API sorting replaces broken DOM drag-and-drop.
// YouTube no longer accepts synthetic DragEvent - drag simulation was broken.
// Now uses youtubei/v1/browse/edit_playlist with ACTION_MOVE_VIDEO_AFTER.

// CSS styles
    const css = `
        /* Container wrapper */
        .sort-playlist {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: linear-gradient(to bottom, var(--yt-spec-base-background) 0%, var(--yt-spec-raised-background) 100%);
            border-bottom: 1px solid var(--yt-spec-10-percent-layer);
            width: 100%;
            box-sizing: border-box;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        /* Controls grouping */
        .sort-playlist-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        /* Sort button wrapper */
        #sort-toggle-button {
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            cursor: pointer;
            background: none;
            outline: none;
            border-radius: 18px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: "YouTube Sans", "Roboto", sans-serif;
            letter-spacing: 0.25px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }

        #sort-toggle-button:active {
            transform: scale(0.96);
        }

        /* Start (green) state */
        .sort-button-start {
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            color: #fff;
            border: none;
        }

        .sort-button-start:hover {
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            box-shadow: 0 2px 8px rgba(46, 204, 113, 0.4);
            transform: translateY(-1px);
        }

        /* Stop (red) state */
        .sort-button-stop {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: #fff;
            border: none;
        }

        .sort-button-stop:hover {
            background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
            box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4);
            transform: translateY(-1px);
        }

        /* Dropdown selector styling */
        .sort-select {
            padding: 8px 14px;
            padding-right: 32px;
            font-size: 14px;
            font-weight: 500;
            border: 1.5px solid var(--yt-spec-10-percent-layer);
            border-radius: 8px;
            background-color: var(--yt-spec-base-background);
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23909090' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 10px center;
            background-size: 12px;
            color: var(--yt-spec-text-primary);
            cursor: pointer;
            transition: all 0.2s ease;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            font-family: "YouTube Sans", "Roboto", sans-serif;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }

        .sort-select:hover {
            border-color: var(--yt-spec-text-secondary);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
        }

        .sort-select option {
            color: var(--yt-spec-text-primary);
            background-color: var(--yt-spec-base-background);
            padding: 8px;
        }

        .sort-select:focus {
            border-color: var(--yt-spec-call-to-action);
            box-shadow: 0 0 0 3px rgba(62, 166, 255, 0.15);
            outline: none;
        }

        /* Status log element */
        .sort-log {
            margin-left: auto;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 400;
            background-color: var(--yt-spec-badge-chip-background);
            border: 1px solid var(--yt-spec-10-percent-layer);
            border-radius: 16px;
            color: var(--yt-spec-text-secondary);
            white-space: nowrap;
            font-family: "YouTube Sans", "Roboto", sans-serif;
            line-height: 1.4;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            max-width: 500px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .sort-playlist {
                gap: 10px;
                padding: 12px;
            }

            .sort-log {
                margin-left: 0;
                width: 100%;
                max-width: 100%;
                text-align: center;
            }

            #sort-toggle-button {
                flex: 1;
                min-width: 120px;
            }
        }

        .sort-playlist[data-yt-dark="true"] {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .sort-playlist[data-yt-dark="true"] .sort-select {
            background-color: #272727;
            color: #f1f1f1;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23aaaaaa' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
        }

        .sort-playlist[data-yt-dark="true"] .sort-select option {
            background-color: #272727;
            color: #f1f1f1;
        }

        .sort-playlist[data-yt-dark="true"] .sort-log {
            background-color: #272727;
            border-color: #404040;
            color: #f1f1f1;
        }

        .sort-playlist[data-yt-dark="true"] .sort-playlist-controls label,
        .sort-playlist[data-yt-dark="true"] .sort-playlist-controls span {
            color: #f1f1f1;
        }

        /* Smooth animations */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .sort-log.sorting {
            animation: pulse 2s ease-in-out infinite;
        }
    `

    const modeAvailable = [
        { value: 'asc', label: 'by Shortest' },
        { value: 'desc', label: 'by Longest' }
    ];

    const debug = false;

    // Config
    let isSorting = false;
    let sortMode = 'asc';
    let autoScrollInitialVideoList = true;
    let log = document.createElement('div');
    let stopSort = false;
    let isPaused = false;
    let lastFullLoadTimestamp = 0;

    const TIMING_CONFIG = {
        scrollDelay: 320,
        apiDelay: 600,
        apiRetryDelay: 2000
    };

    const UNIQUE_KEY_FIELD = 'ysbdKey';

    // Simplified stable key generation using DOM order + video ID
    const generateStableKey = (item, index) => {
        if (!item) return `fallback-${index}`;

        // Try to get video ID from data attribute
        let videoId = item.dataset?.videoId || item.getAttribute('data-video-id');

        // If no video ID, try to extract from href
        if (!videoId) {
            const thumb = item.querySelector('a#thumbnail');
            const href = thumb?.getAttribute('href') || thumb?.href || '';
            if (href) {
                const matchWatch = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                const matchShort = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                videoId = matchWatch?.[1] || matchShort?.[1];
            }
        }

        // Use video ID as primary key, fallback to index
        return videoId ? `vid-${videoId}` : `idx-${index}`;
    };



    const getPlaylistId = () => new URLSearchParams(window.location.search).get('list');

    const getSapisidHash = async () => {
        const match = document.cookie.match(/SAPISID=([^;]+)/);
        if (!match) return null;
        const timestamp = Math.floor(Date.now() / 1000);
        const hash = await crypto.subtle.digest('SHA-1',
            new TextEncoder().encode(timestamp + ' ' + match[1] + ' ' + window.origin));
        const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        return timestamp + '_' + hex;
    };

    const extractSetVideoIds = () => {
        const map = new Map();
        try {
            const contents = ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs;
            if (!contents) return map;
            for (const tab of contents) {
                const sectionList = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
                if (!sectionList) continue;
                for (const section of sectionList) {
                    const itemSection = section?.itemSectionRenderer?.contents;
                    if (!itemSection) continue;
                    for (const item of itemSection) {
                        const videoList = item?.playlistVideoListRenderer?.contents;
                        if (!videoList) continue;
                        for (const entry of videoList) {
                            const r = entry?.playlistVideoRenderer;
                            // KEY: Use the SAME key format as generateStableKey for consistency
                            // generateStableKey returns: `vid-{videoId}` or `idx-{index}`
                            const videoId = r?.videoId;
                            const setVideoId = r?.setVideoId;
                            if (videoId && setVideoId) {
                                // Use same key format as generateStableKey
                                map.set('vid-' + videoId, setVideoId);
                            }
                        }
                    }
                }
            }
        } catch (e) { console.debug('[YouTubeSortByDuration] ytInitialData parse error', e); }
        return map;
    };

    const moveVideoApi = async (setVideoId, predecessorId, playlistId) => {
        const hash = await getSapisidHash();
        if (!hash) throw new Error('SAPISID cookie not found');
        const actions = [{ action: 'ACTION_MOVE_VIDEO_AFTER', setVideoId }];
        if (predecessorId) actions[0].movedSetVideoIdPredecessor = predecessorId;
        const res = await fetch('https://www.youtube.com/youtubei/v1/browse/edit_playlist?key=' + ytcfg.data_.INNERTUBE_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'SAPISIDHASH ' + hash },
            body: JSON.stringify({
                context: { client: { clientName: 'WEB', clientVersion: ytcfg.data_.INNERTUBE_CLIENT_VERSION } },
                actions, playlistId
            })
        });
        if (!res.ok) throw new Error('API error ' + res.status);
        return res.json();
    };

    const sortByApi = async (snapshot, setVideoIdMap, playlistId) => {
        const entries = snapshot.map(v => ({
            key: v.key, videoId: v.key.replace('vid-', ''),
            duration: Number.isFinite(v.duration) ? v.duration : (sortMode === 'asc' ? Infinity : -Infinity),
            title: v.title
        }));
        entries.sort((a, b) => sortMode === 'asc' ? a.duration - b.duration : b.duration - a.duration);

        const desired = entries.map(e => e.videoId).filter(Boolean);
        if (!desired.length) { logActivity('❌ No sortable items.'); return false; }

        const current = entries.map(e => e.videoId);
        if (!current.length) { logActivity('❌ No videos in snapshot.'); return false; }

        let alreadySorted = true;
        for (let i = 0; i < Math.min(current.length, desired.length); i++) {
            if (current[i] !== desired[i]) { alreadySorted = false; break; }
        }
        if (alreadySorted) { logActivity(`✅ Playlist already sorted.`); return true; }

        let errors = 0;
        const maxErrors = 8;

        for (let pos = 0; pos < desired.length && !stopSort && errors < maxErrors; pos++) {
            if (current[pos] === desired[pos]) continue;

            const targetVideoId = desired[pos];
            const sourcePos = current.indexOf(targetVideoId);
            if (sourcePos === -1) {
                logActivity(`⚠️ Video ${targetVideoId.slice(0,8)}... not found. Skipping.`);
                errors++; continue;
            }

            const targetSetVideoId = setVideoIdMap.get('vid-' + targetVideoId);
            if (!targetSetVideoId) {
                logActivity(`⚠️ No setVideoId for position ${pos + 1}. Skipping.`);
                errors++; continue;
            }

            let predecessorId = null;
            if (pos > 0) {
                const predId = desired[pos - 1];
                predecessorId = setVideoIdMap.get('vid-' + predId);
            }

            const title = entries.find(e => e.videoId === targetVideoId)?.title || `Video ${pos + 1}`;
            logActivity(`🔄 (${pos + 1}/${desired.length}) Moving "${title}" → position ${pos + 1}`);

            try {
                await moveVideoApi(targetSetVideoId, predecessorId, playlistId);
                current.splice(sourcePos, 1);
                current.splice(pos, 0, targetVideoId);
                errors = 0;
                logActivity(`📊 Progress: ${pos + 1}/${desired.length}`);
            } catch (e) {
                console.debug('[YouTubeSortByDuration] API error', e);
                logActivity(`⚠️ API error: ${e.message}. Retrying...`);
                errors++;
                await sleep(2000);
            }
        }

        const success = errors < maxErrors;
        if (success) {
            logActivity(`✅ API sort complete. Reloading playlist to reflect changes...`);
            await sleep(500);
            window.location.reload();
        } else {
            logActivity('❌ Too many errors. Aborting.');
        }
        return success;
    };

    // Scroll to position or page bottom with enhanced detection
    const autoScroll = async (scrollTop = null) => {
        const element = document.scrollingElement;
        const destination = scrollTop !== null ? scrollTop : element.scrollHeight;
        element.scrollTop = destination;
        logActivity(`Scrolling page... 📜`);
        await sleep(TIMING_CONFIG.scrollDelay);
    };

    // Sleep utility
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Enhanced scroll with better lazy loading detection
    const scrollUntilAllLoaded = async (reportedCount) => {
        const playlistContainer = document.querySelector("ytd-playlist-video-list-renderer");
        if (!playlistContainer) {
            logActivity("❌ Playlist container not found");
            return 0;
        }

        let allDragPoints = playlistContainer.querySelectorAll("yt-icon#reorder");
        let initialVideoCount = allDragPoints.length;
        let scrollRetryCount = 0;

        logActivity(`📊 Loading all ${reportedCount} videos...`);

        // Check if we need to scroll at all - use min to avoid loading too many
        if (initialVideoCount >= reportedCount) {
            // Trim to reported count to avoid extras
            const actualCount = Math.min(initialVideoCount, reportedCount);
            logActivity(`✅ Videos already loaded (${actualCount}/${reportedCount})`);
            lastFullLoadTimestamp = Date.now();
            return actualCount;
        }

        while (initialVideoCount < reportedCount && !stopSort && scrollRetryCount < 10) {
            logActivity(`⏳ Loading more videos - ${allDragPoints.length} loaded`);

            if (scrollRetryCount > 5) {
                logActivity(`⚠️ Scroll retry count high (${scrollRetryCount}/10)`);
            }

            // Scroll to bottom
            const scrollElem = document.scrollingElement;
            const currentScroll = scrollElem.scrollTop;
            scrollElem.scrollTop = scrollElem.scrollHeight;

            // Wait for content to load (reduced from 1500ms)
            await sleep(1000);

            // Get new count
            allDragPoints = playlistContainer.querySelectorAll("yt-icon#reorder");
            const newCount = allDragPoints.length;

            if (newCount > initialVideoCount) {
                // Progress made
                initialVideoCount = newCount;
                scrollRetryCount = 0; // Reset on progress
                logActivity(`✅ Loaded ${initialVideoCount}/${reportedCount} videos`);
            } else {
                // No progress
                scrollRetryCount++;
                logActivity(`⏸️ No new videos loaded (attempt ${scrollRetryCount}/10)`);
                await sleep(1000);
            }

            // Check for spinner
            const spinner = document.querySelector('.ytd-continuation-item-renderer');
            if (!spinner && initialVideoCount < reportedCount) {
                logActivity(`⚠️ No spinner but not all videos loaded. Retrying...`);
                await sleep(1000);
            } else if (!spinner) {
                // No spinner and close enough, break
                if (initialVideoCount >= reportedCount * 0.95) {
                    logActivity(`✅ Close enough: ${initialVideoCount}/${reportedCount}`);
                    break;
                }
            }

            // Check if we're close enough to reported count
            if (Math.abs(reportedCount - initialVideoCount) <= 5) {
                scrollRetryCount++;
                if (scrollRetryCount > 3) {
                    logActivity(`✅ Close to target: ${initialVideoCount}/${reportedCount}`);
                    break;
                }
            }
        }

        if (scrollRetryCount >= 10) {
            logActivity(`⚠️ Max scroll attempts reached. Proceeding with ${initialVideoCount} videos.`);
        } else {
            logActivity(`✅ Loaded ${initialVideoCount} videos successfully`);
        }
        lastFullLoadTimestamp = Date.now();

        // Return the minimum of what we loaded vs what was reported
        // This prevents issues with extra DOM elements being counted
        return Math.min(initialVideoCount, reportedCount);
    };

    // Log message to UI and console for debugging
    let logActivity = (message) => {
        if (log) {
            log.innerText = message;
            // Add pulse animation during active sorting
            if (message.includes('🔄') || message.includes('⏳') || message.includes('📊 Progress')) {
                log.classList.add('sorting');
            } else if (message.includes('✅') || message.includes('⛔') || message.includes('❌')) {
                log.classList.remove('sorting');
            }
        }
        // Always log to console for debugging
        console.log(`[YouTubeSortByDuration] ${message}`);
    };

    const installThrottleMonitor = () => {
        if (window.__ysbdThrottleMonitorInstalled) return;
        if (typeof XMLHttpRequest === 'undefined' || !XMLHttpRequest.prototype) return;
        window.__ysbdThrottleMonitorInstalled = true;
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function patchedSend(...args) {
            this.addEventListener('readystatechange', () => {
                try {
                    if (this.readyState === 4 && this.responseURL && this.responseURL.includes('/browse/edit_playlist')) {
                        if (this.status === 409 || this.status >= 400) {
                            console.warn(`[YouTubeSortByDuration] YouTube API error ${this.status} on edit_playlist`);
                        }
                    }
                } catch (error) {
                    console.debug('[YouTubeSortByDuration] Throttle monitor error', error);
                }
            });
            return originalSend.apply(this, args);
        };
    };

    installThrottleMonitor();

    // Create UI container
    let renderContainerElement = () => {
        // Remove old container if any
        const existing = document.querySelector('.sort-playlist');
        if (existing) existing.remove();

        // Create new container
        const element = document.createElement('div');
        element.className = 'sort-playlist';
        element.style.margin = '8px 0';

        const controls = document.createElement('div');
        controls.className = 'sort-playlist-controls';
        element.appendChild(controls);

        // Insert above playlist video list
        const list = document.querySelector('ytd-playlist-video-list-renderer');
        if (list && list.parentNode) {
            list.parentNode.insertBefore(element, list);
        } else {
            console.error('Playlist video list not found for UI injection');
        }
    };

    // Create sort toggle button
    let renderToggleButton = () => {
        const element = document.createElement('button');
        element.id = 'sort-toggle-button';
        element.className = 'style-scope sort-button-toggle sort-button-start';
        element.innerText = 'Sort Videos';

        element.onclick = async () => {
            if (!isSorting) {
                // Start
                isSorting = true;
                element.className = 'style-scope sort-button-toggle sort-button-stop';
                element.innerText = 'Stop Sorting';
                await activateSort();
                // Reset
                isSorting = false;
                element.className = 'style-scope sort-button-toggle sort-button-start';
                element.innerText = 'Sort Videos';
            } else {
                // Stop
                stopSort = true;
                isSorting = false;
                element.className = 'style-scope sort-button-toggle sort-button-start';
                element.innerText = 'Sort Videos';
            }
        };

        document.querySelector('.sort-playlist-controls').appendChild(element);
    };

    // Create dropdown selector
    let renderSelectElement = (variable = 0, options = [], label = '') => {
        const element = document.createElement('select');
        element.className = 'style-scope sort-select';
        element.onchange = (e) => {
            if (variable === 0) {
                sortMode = e.target.value;
            } else if (variable === 1) {
                autoScrollInitialVideoList = e.target.value;
            }
        };

        options.forEach((option) => {
            const optionElement = document.createElement('option')
            optionElement.value = option.value
            optionElement.innerText = option.label
            element.appendChild(optionElement)
        });

        document.querySelector('.sort-playlist-controls').appendChild(element);
    };

    // Create status log display
    let renderLogElement = () => {
        log.className = 'style-scope sort-log';
        log.innerText = 'Please wait for the playlist to fully load before sorting...';
        document.querySelector('div.sort-playlist').appendChild(log);
    };

    // Add CSS to page
    let addCssStyle = () => {
        const element = document.createElement('style');
        element.textContent = css;
        document.head.appendChild(element);
    };

    // YouTube has its own dark mode toggle (separate from OS prefers-color-scheme).
    // We detect it by checking the app background color, which is very dark in dark mode.
    const applyTheme = () => {
        const container = document.querySelector('.sort-playlist');
        if (!container) return;
        const ytdApp = document.querySelector('ytd-app');
        if (!ytdApp) return;
        const bg = getComputedStyle(ytdApp).backgroundColor;
        const r = parseInt(bg.replace(/[^0-9,]/g, '').split(',')[0], 10);
        container.dataset.ytDark = String(!isNaN(r) && r < 40);
    };



    // Check if playlist is fully loaded
    let isPlaylistFullyLoaded = (reportedCount, loadedCount) => {
        const hasSpinner = document.querySelector('.ytd-continuation-item-renderer') !== null;
        return reportedCount === loadedCount && !hasSpinner;
    };

    // Check if YouTube page is ready
    let isYouTubePageReady = () => {
        const playlistContainer = document.querySelector("ytd-playlist-video-list-renderer");
        const videoCountElement = document.querySelector("ytd-playlist-sidebar-primary-info-renderer #stats span:first-child");
        const dragPoints = playlistContainer ? playlistContainer.querySelectorAll("yt-icon#reorder") : [];

        // Spinner detection
        const spinnerElements = document.querySelectorAll('.ytd-continuation-item-renderer, yt-icon-button.ytd-continuation-item-renderer, .circle.ytd-spinner');
        const hasVisibleSpinner = Array.from(spinnerElements).some(el => {
            const rect = el.getBoundingClientRect();
            return (rect.width > 0 && rect.height > 0 &&
                    rect.top >= 0 && rect.top <= window.innerHeight);
        });

        const reportedCount = videoCountElement ? parseInt(videoCountElement.innerText, 10) : 0;
        const loadedCount = dragPoints.length;
        const youtubeLoadLimit = 100;

        // Check readiness
        const basicElementsReady = playlistContainer && videoCountElement && reportedCount > 0 && loadedCount > 0;
        const hasEnoughVideos = loadedCount >= 95 || loadedCount === reportedCount;
        const fullyLoaded = (!hasVisibleSpinner && hasEnoughVideos) ||
                             (loadedCount >= 0.97 * Math.min(reportedCount, youtubeLoadLimit));

        const isReady = basicElementsReady && fullyLoaded;

        // Show status
        if (isReady) {
            if (loadedCount < reportedCount) {
                logActivity(`✅ Ready: ${loadedCount}/${reportedCount} videos (YT limit)`);
            } else {
                logActivity(`✅ Ready: ${loadedCount}/${reportedCount} videos`);
            }
        } else if (basicElementsReady) {
            if (hasVisibleSpinner) {
                logActivity(`⏳ Loading: ${loadedCount}/${reportedCount} videos`);
            } else if (loadedCount < reportedCount && loadedCount > 0) {
                logActivity(`🔄 Waiting to scroll: ${loadedCount}/${reportedCount} videos`);
            } else {
                logActivity(`🔄 Waiting: ${loadedCount}/${reportedCount || '?'} videos`);
            }
        } else {
            logActivity(`🔄 Initializing...`);
        }
        return isReady;
    };

    // Simplified playlist item reader with stable keys
    const getPlaylistItems = (playlistContainer) => {
        const items = Array.from(playlistContainer.querySelectorAll('ytd-playlist-video-renderer'));
        const result = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const dragHandle = item.querySelector('yt-icon#reorder');
            if (!dragHandle) continue;

            // Generate stable key
            const key = generateStableKey(item, i);

            // Store key on element for quick lookup
            if (!item.dataset[UNIQUE_KEY_FIELD]) {
                item.dataset[UNIQUE_KEY_FIELD] = key;
            }

            const titleElement = item.querySelector('#video-title');
            const title = titleElement ? titleElement.textContent.trim() : '';

            const timeOverlay = item.querySelector('ytd-thumbnail-overlay-time-status-renderer span#text');
            let duration = sortMode === 'asc' ? Infinity : -Infinity;
            let durationText = null;

            if (timeOverlay && timeOverlay.innerText) {
                durationText = timeOverlay.innerText.trim();
                const timeSp = durationText.split(':').reverse();
                if (timeSp.length >= 1) {
                    const seconds = parseInt(timeSp[0], 10) || 0;
                    const minutes = timeSp[1] ? parseInt(timeSp[1], 10) * 60 : 0;
                    const hours = timeSp[2] ? parseInt(timeSp[2], 10) * 3600 : 0;
                    duration = seconds + minutes + hours;
                }
            }

            result.push({
                key,
                duration,
                durationText,
                item,
                dragHandle,
                index: i,
                title,
                hasDuration: Number.isFinite(duration)
            });
        }

        return result;
    };

    const ensureDurationsLoaded = async (playlistContainer, expectedCount) => {
        let attempts = 0;
        let snapshot = [];
        const scrollElement = document.scrollingElement;
        const originalScrollTop = scrollElement ? scrollElement.scrollTop : 0;

        while (attempts < 8 && !stopSort) {
            snapshot = getPlaylistItems(playlistContainer).slice(0, expectedCount);
            const missingDurations = snapshot.filter((video) => !video.hasDuration).length;

            if (missingDurations === 0 || expectedCount === 0) {
                return snapshot;
            }

            logActivity(`⏳ Waiting for durations... (${expectedCount - missingDurations}/${expectedCount})`);
            document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
            await sleep(700);
            document.scrollingElement.scrollTop = 0;
            await sleep(500);
            attempts++;
        }

        if (snapshot.length) {
            const missingDurations = snapshot.filter((video) => !video.hasDuration).length;
            if (missingDurations > 0) {
                logActivity(`⚠️ Proceeding with ${missingDurations} videos missing duration data`);
            }
        }

        if (scrollElement) {
            scrollElement.scrollTop = originalScrollTop;
        }

        return snapshot;
    };

    const captureVisibleVideos = (playlistContainer, videoMap) => {
        const visible = getPlaylistItems(playlistContainer);
        let newEntries = 0;

        for (const video of visible) {
            if (!video || !video.key) continue;
            if (!videoMap.has(video.key) || (!videoMap.get(video.key).hasDuration && video.hasDuration)) {
                videoMap.set(video.key, {
                    key: video.key,
                    duration: video.duration,
                    durationText: video.durationText,
                    title: video.title,
                    hasDuration: video.hasDuration
                });
                newEntries++;
            }
        }

        return { added: newEntries, visibleCount: visible.length };
    };

    const collectFullPlaylistSnapshot = async (playlistContainer, reportedCount) => {
        const scrollElement = document.scrollingElement;
        if (!playlistContainer || !scrollElement) return [];

        const videoMap = new Map();
        const maxStagnantScrolls = 30;
        let stagnantScrolls = 0;

        scrollElement.scrollTop = 0;
        await sleep(500);
        captureVisibleVideos(playlistContainer, videoMap);

        while (videoMap.size < reportedCount && stagnantScrolls < maxStagnantScrolls && !stopSort) {
            const previousSize = videoMap.size;
            const previousScroll = scrollElement.scrollTop;

            scrollElement.scrollTop = Math.min(scrollElement.scrollHeight, scrollElement.scrollTop + window.innerHeight * 0.9);
            await sleep(350);
            captureVisibleVideos(playlistContainer, videoMap);

            if (videoMap.size === previousSize && scrollElement.scrollTop === previousScroll) {
                stagnantScrolls++;
            } else {
                stagnantScrolls = 0;
            }

            if (scrollElement.scrollTop >= scrollElement.scrollHeight - window.innerHeight - 5) {
                // Bounce slightly upward to encourage fresh loads
                scrollElement.scrollTop = Math.max(0, scrollElement.scrollTop - window.innerHeight * 0.5);
                await sleep(250);
            }
        }

        // Ensure we captured anything newly loaded while returning to top
        scrollElement.scrollTop = 0;
        await sleep(500);
        captureVisibleVideos(playlistContainer, videoMap);

        if (videoMap.size >= reportedCount) {
            logActivity(`✅ Captured metadata for ${videoMap.size}/${reportedCount} videos`);
        } else if (videoMap.size > 0) {
            logActivity(`⚠️ Only captured ${videoMap.size}/${reportedCount} videos during scan. Will sort available entries.`);
        }

        return Array.from(videoMap.values());
    };

    const activateSort = async () => {
        stopSort = false;

        const playlistId = getPlaylistId();
        if (!playlistId) { logActivity('❌ No playlist ID found.'); return; }

        const playlistContainer = document.querySelector("ytd-playlist-video-list-renderer");
        const videoCountElement = document.querySelector("ytd-playlist-sidebar-primary-info-renderer #stats span:first-child");
        const reportedVideoCount = videoCountElement ? parseInt(videoCountElement.innerText, 10) : 0;

        if (!playlistContainer || !reportedVideoCount) {
            logActivity("❌ Playlist not ready for sorting");
            return;
        }

        logActivity(`📊 Scanning playlist metadata (${reportedVideoCount})...`);

        let snapshot = [];
        try {
            snapshot = await collectFullPlaylistSnapshot(playlistContainer, reportedVideoCount);
        } catch (e) {
            console.debug('[YouTubeSortByDuration] Snapshot scan failed', e);
        }

        if (!snapshot || snapshot.length === 0) {
            const loaded = await scrollUntilAllLoaded(reportedVideoCount);
            snapshot = getPlaylistItems(playlistContainer).map(v => ({ key: v.key, duration: v.duration, durationText: v.durationText, hasDuration: v.hasDuration }));
            if (!snapshot || snapshot.length === 0) {
                logActivity('❌ Unable to capture playlist metadata. Aborting.');
                return;
            }
        }

        logActivity(`🔑 Extracting video identifiers from ytInitialData...`);
        const setVideoIdMap = extractSetVideoIds();
        if (setVideoIdMap.size === 0) {
            logActivity('❌ Could not extract setVideoIds from ytInitialData. Try refreshing the page.');
            return;
        }

        logActivity(`✅ Found ${setVideoIdMap.size} video entries. Setting manual sort mode...`);

        const sortDropdowns = [
            'yt-dropdown-menu[icon-label="Ordenar"]',
            'yt-dropdown-menu[icon-label="Sort"]',
            'yt-dropdown-menu tp-yt-paper-button',
            'tp-yt-iron-dropdown + tp-yt-paper-button'
        ];
        const sortButton = document.querySelector(sortDropdowns.join(', '));
        if (sortButton) {
            try {
                logActivity(`🔄 Clicking sort dropdown...`);
                document.body.click();
                await sleep(100);
                sortButton.click();
                await sleep(300);
                const dropdown = document.querySelector('tp-yt-paper-listbox, yt-sort-filter-button-group');
                if (dropdown) {
                    const options = dropdown.querySelectorAll('tp-yt-paper-item, yt-sort-filter-button-group > button');
                    for (const opt of options) {
                        const text = (opt.textContent || '').toLowerCase();
                        if (text.includes('manual')) {
                            logActivity(`🔄 Selecting manual sort...`);
                            opt.click();
                            await sleep(400);
                            break;
                        }
                    }
                    document.body.click();
                }
            } catch (e) { console.debug('[YouTubeSortByDuration] Sort mode change error', e); }
        } else {
            logActivity(`ℹ️ No sort dropdown found (playlist may not support sorting)`);
        }

        logActivity(`🔄 Sorting ${snapshot.length} videos via YouTube API...`);

        try {
            const result = await sortByApi(snapshot, setVideoIdMap, playlistId);

            if (stopSort) {
                logActivity('Sort cancelled.');
                stopSort = false;
            } else if (result) {
                logActivity(`✅ Sort complete! All videos sorted.`);
            } else {
                logActivity(`⚠️ Sort finished with some issues.`);
            }
        } catch (err) {
            console.debug('[YouTubeSortByDuration] Sort error', err);
            logActivity('❌ Error during sorting: ' + err.message);
            if (stopSort) stopSort = false;
        }
    };

    // Initialize UI
    let init = () => {
        onElementReady('ytd-playlist-video-list-renderer', false, () => {
            // Avoid duplicate
            if (document.querySelector('.sort-playlist')) return;

            autoScrollInitialVideoList = true;

            addCssStyle();
            renderContainerElement();
            renderToggleButton();
            renderSelectElement(0, modeAvailable, 'Sort Order');
            renderLogElement();

            applyTheme();
            const themeInterval = setInterval(applyTheme, 2000);

            const checkInterval = setInterval(() => {
                if (isYouTubePageReady()) {
                    logActivity('✓ Ready to sort');
                    clearInterval(checkInterval);
                }
            }, 1000);

            const containerCheck = setInterval(() => {
                if (!document.querySelector('.sort-playlist')) {
                    clearInterval(themeInterval);
                    clearInterval(containerCheck);
                }
            }, 5000);
        });
    };

    // Initialize script
    (() => {
        init();
        // Re-init UI on in-app navigation (guard for browsers without navigation API)
        if (window.navigation && typeof window.navigation.addEventListener === 'function') {
            window.navigation.addEventListener('navigate', () => {
                setTimeout(() => {
                    if (!document.querySelector('.sort-playlist')) init();
                }, 500);
            });
        }
    })();

