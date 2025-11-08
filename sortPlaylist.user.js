// ==UserScript==
// @name              YouTubeSortByDuration
// @namespace         https://github.com/cloph-dsp/YouTubeSortByDuration
// @version           5.0
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

        /* Dark mode enhancement */
        @media (prefers-color-scheme: dark) {
            .sort-playlist {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            .sort-select {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23aaaaaa' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            }
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

    // Enhanced timing configuration
    const TIMING_CONFIG = {
        scrollDelay: 320, // Base delay for scrolling
        scrollRetryDelay: 720, // Delay when retrying scroll
        dragBaseDelay: 150, // Minimum delay between drags (increased from 80)
        dragProcessDelay: 200, // Wait for drag animation to start (increased from 110)
        dragStabilizationDelay: 500, // Wait for DOM to stabilize (increased from 320)
        maxWaitTime: 5000, // Maximum time to wait for YouTube before falling back (increased from 4000)
        pollInterval: 100, // Polling interval for state checks (increased from 80)
        recoveryDelay: 1200, // Delay for recovery attempts (increased from 900)
        adaptiveMultiplier: 1.35, // Multiplier for adaptive delays
        largePlaylistExtraDelay: 400 // Extra delay for large playlists (>150 videos)
    };

    const adaptiveState = {
        dragSuccessStreak: 0,
        throttlePenalty: 0,
        throttleUntil: 0,
        lastThrottleMessage: 0
    };

    const getAdaptiveDelay = (base, { minimum = 80 } = {}) => {
        if (!base) return minimum;
        const streak = adaptiveState.dragSuccessStreak;
        const factor = 1 - Math.min(0.35, streak * 0.05);
        const penaltyFactor = 1 + Math.min(1.5, adaptiveState.throttlePenalty * 0.5);
        return Math.max(minimum, Math.round(base * factor * penaltyFactor));
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

    // Error tracking
    const errorTracker = {
        consecutiveErrors: 0,
        totalErrors: 0,
        lastError: null,
        maxConsecutiveErrors: 5
    };

    // Fire mouse event at coordinates
    let fireMouseEvent = (type, elem, centerX, centerY) => {
        const event = new MouseEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY
        });

        elem.dispatchEvent(event);
    };

    // Simulate drag between elements
    let simulateDrag = (elemDrag, elemDrop) => {
        // Get positions
        let pos = elemDrag.getBoundingClientRect();
        let center1X = Math.floor((pos.left + pos.right) / 2);
        let center1Y = Math.floor((pos.top + pos.bottom) / 2);
        pos = elemDrop.getBoundingClientRect();
        let center2X = Math.floor((pos.left + pos.right) / 2);
        let center2Y = Math.floor((pos.top + pos.bottom) / 2);

        // Mouse events for dragged element
        fireMouseEvent("mousemove", elemDrag, center1X, center1Y);
        fireMouseEvent("mouseenter", elemDrag, center1X, center1Y);
        fireMouseEvent("mouseover", elemDrag, center1X, center1Y);
        fireMouseEvent("mousedown", elemDrag, center1X, center1Y);

        // Start drag
        fireMouseEvent("dragstart", elemDrag, center1X, center1Y);
        fireMouseEvent("drag", elemDrag, center1X, center1Y);
        fireMouseEvent("mousemove", elemDrag, center1X, center1Y);
        fireMouseEvent("drag", elemDrag, center2X, center2Y);
        fireMouseEvent("mousemove", elemDrop, center2X, center2Y);

        // Events over drop target
        fireMouseEvent("mouseenter", elemDrop, center2X, center2Y);
        fireMouseEvent("dragenter", elemDrop, center2X, center2Y);
        fireMouseEvent("mouseover", elemDrop, center2X, center2Y);
        fireMouseEvent("dragover", elemDrop, center2X, center2Y);

        // Complete drop
        fireMouseEvent("drop", elemDrop, center2X, center2Y);
        fireMouseEvent("dragend", elemDrag, center2X, center2Y);
        fireMouseEvent("mouseup", elemDrag, center2X, center2Y);
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

    const handlePlaylistRateLimit = () => {
        adaptiveState.dragSuccessStreak = 0;
        adaptiveState.throttlePenalty = Math.min(12, adaptiveState.throttlePenalty + 1);
        const backoffMs = 3000 + adaptiveState.throttlePenalty * 2000; // Increased from 2000 + penalty * 1500
        adaptiveState.throttleUntil = Math.max(adaptiveState.throttleUntil, Date.now() + backoffMs);
        adaptiveState.lastThrottleMessage = 0;
        logActivity(`⚠️ YouTube rate limit detected. Backing off for ${Math.ceil(backoffMs / 1000)}s...`);
    };

    const consumeThrottleCooldown = async () => {
        if (!adaptiveState.throttleUntil) return;
        const waitMs = adaptiveState.throttleUntil - Date.now();
        if (waitMs > 0) {
            if (Date.now() - adaptiveState.lastThrottleMessage > 1000) {
                logActivity(`⏳ Cooling down for ${Math.ceil(waitMs / 1000)}s to respect YouTube limits...`);
                adaptiveState.lastThrottleMessage = Date.now();
            }
            await sleep(waitMs);
        }
        adaptiveState.throttleUntil = 0;
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
                        // Detect any error response from edit_playlist endpoint
                        if (this.status === 409 || this.status >= 400) {
                            console.warn(`[YouTubeSortByDuration] YouTube API error ${this.status} on edit_playlist`);
                            handlePlaylistRateLimit();
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

    // Create number input
    let renderNumberElement = (defaultValue = 0, label = '') => {
        const elementDiv = document.createElement('div');
        elementDiv.className = 'sort-playlist-div sort-margin-right-3px';
        elementDiv.innerText = label;

        const element = document.createElement('input');
        element.type = 'number';
        element.value = defaultValue;
        element.className = 'style-scope';
        element.oninput = (e) => {
            // This variable appears to be unused - commenting out to fix linting
            // scrollLoopTime = +(e.target.value);
        };

        elementDiv.appendChild(element);
        document.querySelector('div.sort-playlist').appendChild(elementDiv);
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

    // Wait for YouTube to process drag with enhanced detection
    const waitForYoutubeProcessing = async () => {
        // Initial short wait for drag animation to start
        await sleep(getAdaptiveDelay(TIMING_CONFIG.dragProcessDelay, { minimum: 70 }));

        // Poll for stability - check if DOM has stabilized
        const startTime = Date.now();
        let lastItemCount = 0;
        let stableChecks = 0;
        const playlistContainer = document.querySelector("ytd-playlist-video-list-renderer");
        const requiredStableChecks = adaptiveState.dragSuccessStreak > 3 ? 1 : 2;
        const pollDelayFast = Math.max(60, Math.round(TIMING_CONFIG.pollInterval * 0.7));
        const pollDelay = adaptiveState.dragSuccessStreak > 5 ? pollDelayFast : TIMING_CONFIG.pollInterval;

        while (Date.now() - startTime < TIMING_CONFIG.maxWaitTime && !stopSort) {
            const currentItems = playlistContainer ? playlistContainer.querySelectorAll("yt-icon#reorder").length : 0;

            // Check if count is stable (hasn't changed)
            if (currentItems === lastItemCount && currentItems > 0) {
                stableChecks++;
                // If stable for required checks, we're done
                if (stableChecks >= requiredStableChecks) {
                    const waitTime = Date.now() - startTime;
                    if (waitTime > 1000) {
                        console.log(`[YouTubeSortByDuration] YouTube took ${waitTime}ms to process`);
                    }
                    return true;
                }
            } else {
                // Count changed, reset stability counter
                stableChecks = 0;
                lastItemCount = currentItems;
            }

            await sleep(pollDelay);
        }

        // Additional stabilization wait
        await sleep(getAdaptiveDelay(TIMING_CONFIG.dragStabilizationDelay, { minimum: 140 }));
        return true;
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

    const ensureElementInView = async (element, indexHint = null) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (isVisible) {
            return;
        }

        try {
            element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        } catch (error) {
            element.scrollIntoView({ block: 'center', inline: 'nearest' });
        }

        const hint = Number.isFinite(indexHint) ? Math.min(Math.max(indexHint, 1), 400) : 0;
        const delay = 160 + Math.min(420, hint * 4);
        await sleep(delay);

        // If still not visible, attempt a small nudging scroll
        const reassessed = element.getBoundingClientRect();
        if (reassessed.top < 0 || reassessed.bottom > window.innerHeight) {
            const scrollElement = document.scrollingElement;
            const offset = Math.sign(reassessed.top) * window.innerHeight * 0.25;
            scrollElement.scrollTop += offset;
            await sleep(180);
        }
    };

    // Optimized sorting algorithm using selection sort with validation
    // This ensures we make minimal moves and verify each move succeeds
    const sortVideosOptimized = async (playlistContainer, desiredOrder, expectedCount) => {
        let moveCount = 0;
        let verificationFailures = 0;
        const maxVerificationFailures = 5;
        let domRefreshAttempts = 0;
        const maxDomRefreshAttempts = 8; // Increased from 3 to allow more scroll attempts

        // Selection sort: for each position, find the correct video and move it there
        for (let targetPos = 0; targetPos < expectedCount && !stopSort; targetPos++) {
            await consumeThrottleCooldown();

            // Get fresh DOM state
            let currentVideos = getPlaylistItems(playlistContainer);

            // Handle DOM count mismatch - scroll to load more videos
            if (currentVideos.length < expectedCount) {
                domRefreshAttempts++;

                if (domRefreshAttempts > maxDomRefreshAttempts) {
                    // After many attempts, YouTube's DOM limit is preventing us from loading all videos
                    // This is expected for playlists >100 videos during manual reordering
                    logActivity(`⚠️ YouTube DOM limit reached at ${currentVideos.length} videos. Continuing with multi-pass approach...`);

                    // Instead of stopping, continue with what we have
                    // Filter to only videos currently available
                    const availableKeys = new Set(currentVideos.map(v => v.key));
                    const filteredOrder = desiredOrder.filter(key => availableKeys.has(key));

                    // Update expected count to match available videos
                    const originalExpected = expectedCount;
                    expectedCount = filteredOrder.length;
                    desiredOrder = filteredOrder;

                    domRefreshAttempts = 0;

                    logActivity(`🔄 Adjusted to sort ${expectedCount} available videos (${originalExpected - expectedCount} videos out of DOM)`);
                }

                // Only try to load more if we haven't hit the limit
                if (domRefreshAttempts <= maxDomRefreshAttempts) {
                    logActivity(`⚠️ Only ${currentVideos.length}/${expectedCount} videos loaded. Attempting gentle scroll (${domRefreshAttempts}/${maxDomRefreshAttempts})...`);

                    // Gentle scroll: small incremental scroll to load more without unloading current area
                    const scrollElement = document.scrollingElement;
                    if (scrollElement) {
                        const currentScroll = scrollElement.scrollTop;
                        // Small scroll down
                        scrollElement.scrollTop = currentScroll + window.innerHeight;
                        await sleep(600);
                        // Scroll back
                        scrollElement.scrollTop = currentScroll;
                        await sleep(400);
                    }

                    // Check if we made progress
                    currentVideos = getPlaylistItems(playlistContainer);

                    // If STILL not enough and we're far from limit, try one more time
                    if (currentVideos.length < expectedCount && domRefreshAttempts < 3) {
                        targetPos--; // Retry this position
                        continue;
                    }

                    // If we got some videos loaded, continue with what we have
                    if (currentVideos.length > 50) {
                        domRefreshAttempts = 0; // Reset for next time
                    }
                }
            } else if (currentVideos.length > expectedCount) {
                // Too many items - trim to expected count
                currentVideos = currentVideos.slice(0, expectedCount);
                domRefreshAttempts = 0;
            } else {
                // Count is correct, reset retry counter
                domRefreshAttempts = 0;
            }

            const expectedKey = desiredOrder[targetPos];
            const currentKey = currentVideos[targetPos]?.key;

            // Already in correct position?
            if (currentKey === expectedKey) {
                continue;
            }

            // Find where the correct video currently is
            const sourcePos = currentVideos.findIndex(v => v.key === expectedKey);

            if (sourcePos === -1) {
                // Video not found - it may have been unloaded from DOM
                // Try scrolling to load it
                logActivity(`⚠️ Video for position ${targetPos + 1} not in DOM. Scrolling to load it...`);
                await scrollToVideoPosition(playlistContainer, targetPos);
                await sleep(800);

                // Retry getting current videos
                currentVideos = getPlaylistItems(playlistContainer);
                const retrySourcePos = currentVideos.findIndex(v => v.key === expectedKey);

                if (retrySourcePos === -1) {
                    // Still not found after scrolling
                    const availableKeys = currentVideos.map(v => v.key);
                    if (!availableKeys.includes(expectedKey)) {
                        logActivity(`⚠️ Video at position ${targetPos + 1} still not in DOM after scrolling. Skipping...`);
                        continue;
                    } else {
                        logActivity(`❌ Cannot find video for position ${targetPos + 1}. Retrying...`);
                        verificationFailures++;
                        if (verificationFailures >= maxVerificationFailures) {
                            logActivity(`❌ Too many missing videos. Stopping sort.`);
                            return { success: false, moveCount, position: targetPos };
                        }
                        await sleep(500);
                        targetPos--; // Retry this position
                        continue;
                    }
                }
            }

            if (sourcePos === targetPos) {
                continue; // Shouldn't happen but be safe
            }

            const dragVideo = currentVideos[sourcePos];
            const dropVideo = currentVideos[targetPos];

            if (!dragVideo?.dragHandle || !dropVideo?.dragHandle) {
                logActivity(`⚠️ Missing drag handles at position ${targetPos + 1}`);
                await sleep(300);
                continue;
            }

            // Ensure both elements are visible
            await ensureElementInView(dragVideo.item, sourcePos);
            await ensureElementInView(dropVideo.item, targetPos);
            await sleep(getAdaptiveDelay(TIMING_CONFIG.dragBaseDelay, { minimum: 80 }));

            // Perform the drag
            const videoTitle = dragVideo.title || `Video ${sourcePos + 1}`;
            logActivity(`🔄 Moving "${videoTitle}" from ${sourcePos + 1} → ${targetPos + 1}`);

            simulateDrag(dragVideo.dragHandle, dropVideo.dragHandle);
            moveCount++;

            // Wait for YouTube to process
            await waitForYoutubeProcessing();

            // For large playlists (>150 videos), add extra stabilization time
            if (expectedCount > 150) {
                await sleep(TIMING_CONFIG.largePlaylistExtraDelay);
            }

            // Additional delay between moves to prevent rate limiting
            // Minimum 300ms between drag operations for playlists >100 videos
            if (expectedCount > 100) {
                await sleep(Math.max(300, getAdaptiveDelay(200, { minimum: 300 })));
            }

            // CRITICAL: Verify the move succeeded
            let verifyVideos = getPlaylistItems(playlistContainer);

            // Handle DOM count mismatch after move
            if (verifyVideos.length > expectedCount) {
                verifyVideos = verifyVideos.slice(0, expectedCount);
            } else if (verifyVideos.length < expectedCount) {
                // Wait a bit for DOM to stabilize
                await sleep(500);
                verifyVideos = getPlaylistItems(playlistContainer);
                if (verifyVideos.length > expectedCount) {
                    verifyVideos = verifyVideos.slice(0, expectedCount);
                }
            }

            const verifyKey = verifyVideos[targetPos]?.key;

            if (verifyKey !== expectedKey) {
                // Find where the video actually ended up
                const actualPos = verifyVideos.findIndex(v => v.key === expectedKey);
                if (actualPos !== -1) {
                    logActivity(`⚠️ Verification failed at position ${targetPos + 1}. Video found at position ${actualPos + 1}. Retrying...`);

                    // Special case: if video ended up at position 1, the drag didn't work at all
                    // This suggests we need better viewport visibility
                    if (actualPos === 0 && verificationFailures < 3) {
                        logActivity(`🔍 Video bounced to position 1. Ensuring better visibility...`);
                        // Scroll to ensure target is more centrally positioned
                        const targetElement = currentVideos[targetPos]?.item;
                        if (targetElement) {
                            targetElement.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
                            await sleep(800);
                        }
                    }
                } else {
                    logActivity(`⚠️ Verification failed at position ${targetPos + 1}. Video not found in DOM. Retrying...`);
                }

                verificationFailures++;

                if (verificationFailures >= maxVerificationFailures) {
                    logActivity(`❌ Too many verification failures (${verificationFailures}). Stopping sort.`);
                    return { success: false, moveCount, position: targetPos };
                }

                // Wait longer for DOM to stabilize, increase wait time with each failure
                const waitTime = 1500 + (verificationFailures * 700);
                await sleep(waitTime);

                // Force a DOM refresh if we've failed multiple times
                if (verificationFailures >= 3) {
                    logActivity(`🔄 Forcing DOM refresh after ${verificationFailures} failures...`);
                    await scrollToRefreshDOM(playlistContainer, expectedCount);
                    await sleep(1000);
                }

                targetPos--; // Retry this position
                continue;
            }

            // Success - reset failure counter
            verificationFailures = 0;
            adaptiveState.dragSuccessStreak = Math.min(20, adaptiveState.dragSuccessStreak + 1);

            // Update progress
            const progress = Math.round(((targetPos + 1) / expectedCount) * 100);
            logActivity(`� Progress: ${targetPos + 1}/${expectedCount} (${progress}%) | ${moveCount} moves`);

            // Periodic check to ensure next videos are loaded
            // Check every 20 positions to ensure we have a buffer of videos ahead
            if (targetPos > 0 && targetPos % 20 === 0) {
                // Check if we have enough videos loaded ahead
                const lookAhead = Math.min(20, expectedCount - targetPos);
                const neededCount = targetPos + lookAhead;

                if (currentVideos.length < neededCount) {
                    logActivity(`🔄 Loading next videos (have ${currentVideos.length}, need ${neededCount})...`);
                    // Gently scroll forward to load next batch without unloading current position
                    const scrollElement = document.scrollingElement;
                    const currentScroll = scrollElement.scrollTop;
                    scrollElement.scrollTop = currentScroll + (window.innerHeight * 0.5);
                    await sleep(800);
                    // Scroll back to working area
                    scrollElement.scrollTop = currentScroll;
                    await sleep(400);
                }
            }
        }

        return { success: true, moveCount, position: expectedCount, actualCount: expectedCount };
    };

    // Helper to scroll to a specific video position to ensure it's loaded
    const scrollToVideoPosition = async (playlistContainer, videoIndex) => {
        const allItems = playlistContainer.querySelectorAll('ytd-playlist-video-renderer');

        if (videoIndex < allItems.length) {
            // Video is already in DOM, scroll to it
            const targetVideo = allItems[videoIndex];
            try {
                targetVideo.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
            } catch (error) {
                targetVideo.scrollIntoView({ block: 'center', inline: 'nearest' });
            }
            await sleep(600);
        } else {
            // Video not in DOM yet, scroll down to load it
            const scrollElement = document.scrollingElement;
            if (!scrollElement) return;

            // Estimate scroll position based on video index
            // Approximate: each video is ~100px tall
            const estimatedPosition = videoIndex * 100;
            scrollElement.scrollTop = estimatedPosition;
            await sleep(800);

            // If video still not loaded, scroll to bottom
            const recheck = playlistContainer.querySelectorAll('ytd-playlist-video-renderer');
            if (videoIndex >= recheck.length) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
                await sleep(800);
            }
        }
    };

    // Helper to refresh DOM by scrolling - tries to load more items if missing
    const scrollToRefreshDOM = async (playlistContainer, expectedCount) => {
        const scrollElement = document.scrollingElement;
        if (!scrollElement) return;

        // Check current state first
        let items = playlistContainer.querySelectorAll("yt-icon#reorder");
        const currentCount = items.length;

        // If we already have enough items, don't scroll
        if (currentCount >= expectedCount) {
            return;
        }

        const savedScroll = scrollElement.scrollTop;

        // If we're missing a lot of items, scroll to bottom to reload everything
        if (currentCount < expectedCount * 0.7) {
            logActivity(`🔄 Reloading playlist (${currentCount}/${expectedCount} items)...`);
            scrollElement.scrollTop = scrollElement.scrollHeight;
            await sleep(800);
            scrollElement.scrollTop = 0;
            await sleep(600);
        } else {
            // Small scroll down to trigger lazy loading
            scrollElement.scrollTop = Math.min(savedScroll + window.innerHeight * 2, scrollElement.scrollHeight);
            await sleep(400);
            scrollElement.scrollTop = savedScroll;
            await sleep(300);
        }

        // Verify items loaded
        items = playlistContainer.querySelectorAll("yt-icon#reorder");
        logActivity(`🔄 DOM refresh: ${items.length}/${expectedCount} items visible`);
    };

    // Main sorting function - refactored for reliability
    const activateSort = async () => {
        // Reset state
        errorTracker.consecutiveErrors = 0;
        errorTracker.totalErrors = 0;
        stopSort = false;
        isPaused = false;
        adaptiveState.dragSuccessStreak = 0;
        adaptiveState.throttlePenalty = 0;
        adaptiveState.throttleUntil = 0;

        const sortStartTime = Date.now();

        // Set manual sorting mode
        const ensureManualSort = async () => {
            const sortButton = document.querySelector('yt-dropdown-menu[icon-label="Ordenar"] tp-yt-paper-button, yt-dropdown-menu[icon-label="Sort"] tp-yt-paper-button');
            if (!sortButton) {
                logActivity("⚠️ Sort dropdown not found. Using current mode.");
                return false;
            }

            // Check if dropdown is already open and close it first
            const isDropdownOpen = document.querySelector('tp-yt-paper-listbox:not([hidden])');
            if (isDropdownOpen) {
                document.body.click();
                await sleep(100);
            }

            // Open the dropdown menu
            logActivity("🔧 Setting manual sort mode...");
            sortButton.click();
            await sleep(200);

            // Verify dropdown is visible
            let dropdownMenu = document.querySelector('tp-yt-paper-listbox:not([hidden])');
            if (!dropdownMenu) {
                sortButton.click();
                await sleep(250);
                dropdownMenu = document.querySelector('tp-yt-paper-listbox:not([hidden])');
            }

            // Select manual option
            const manualOption = document.querySelector('tp-yt-paper-listbox a:first-child tp-yt-paper-item');
            if (manualOption) {
                const isSelected = manualOption.hasAttribute('selected') ||
                                  manualOption.classList.contains('iron-selected') ||
                                  manualOption.getAttribute('aria-selected') === 'true';

                if (!isSelected) {
                    manualOption.click();
                    logActivity("✅ Switched to Manual sort mode");
                    await sleep(250);
                } else {
                    logActivity("✅ Manual sort mode already active");
                }

                // Close dropdown
                const stillOpen = document.querySelector('tp-yt-paper-listbox:not([hidden])');
                if (stillOpen) {
                    document.body.click();
                    await sleep(100);
                }

                return true;
            } else {
                // Fallback: search for manual in all options
                const allOptions = document.querySelectorAll('tp-yt-paper-listbox a tp-yt-paper-item');
                for (const option of allOptions) {
                    if (option.textContent.toLowerCase().includes('manual')) {
                        option.click();
                        logActivity("✅ Found and selected Manual sort mode");
                        await sleep(250);
                        document.body.click();
                        return true;
                    }
                }

                document.body.click();
                logActivity("⚠️ Manual sort option not found");
                return false;
            }
        };

        await ensureManualSort();

        // Get playlist information
        const videoCountElement = document.querySelector("ytd-playlist-sidebar-primary-info-renderer #stats span:first-child");
        const reportedVideoCount = videoCountElement ? parseInt(videoCountElement.innerText, 10) : 0;
        const playlistContainer = document.querySelector("ytd-playlist-video-list-renderer");

        if (!playlistContainer) {
            logActivity("❌ Playlist container not found");
            return;
        }

        if (reportedVideoCount === 0) {
            logActivity("❌ Could not determine video count");
            return;
        }

        logActivity(`📊 Playlist has ${reportedVideoCount} videos`);

        // Load all videos
        let loadedVideoCount = 0;
        if (autoScrollInitialVideoList) {
            loadedVideoCount = await scrollUntilAllLoaded(reportedVideoCount);
        } else {
            const allDragPoints = playlistContainer.querySelectorAll("yt-icon#reorder");
            loadedVideoCount = allDragPoints.length;
        }

        if (loadedVideoCount === 0) {
            logActivity("❌ No videos loaded");
            return;
        }

        const videoCount = Math.min(reportedVideoCount, loadedVideoCount);
        logActivity(`✅ ${videoCount} videos ready for sorting`);

        // Scroll to top
        document.scrollingElement.scrollTop = 0;
        await sleep(500);

        // Get initial snapshot and ensure durations loaded
        logActivity(`🔍 Loading video durations...`);
        const initialVideos = await ensureDurationsLoaded(playlistContainer, videoCount);

        if (!initialVideos.length) {
            logActivity("❌ Could not read playlist items");
            return;
        }

        // Check for missing durations
        const missingDurations = initialVideos.filter(v => !v.hasDuration).length;
        if (missingDurations > 0) {
            logActivity(`⚠️ ${missingDurations} videos missing duration data`);
        }

        // Build desired sort order
        logActivity(`🎯 Computing sort order...`);
        const sortedVideos = [...initialVideos].sort((a, b) => {
            if (a.duration === b.duration) {
                return a.key.localeCompare(b.key);
            }
            return sortMode === 'asc' ? a.duration - b.duration : b.duration - a.duration;
        });

        const desiredOrder = sortedVideos.map(v => v.key);

        // Check if already sorted
        const currentOrder = initialVideos.map(v => v.key);
        let alreadySorted = true;
        for (let i = 0; i < videoCount; i++) {
            if (currentOrder[i] !== desiredOrder[i]) {
                alreadySorted = false;
                break;
            }
        }

        if (alreadySorted) {
            logActivity(`✅ Playlist is already sorted!`);
            return;
        }

        // Execute sort
        logActivity(`🚀 Starting sort with ${videoCount} videos...`);
        const result = await sortVideosOptimized(playlistContainer, desiredOrder, videoCount);

        const totalTime = Math.round((Date.now() - sortStartTime) / 1000);
        const actualSorted = result.actualCount || result.position;

        if (stopSort) {
            logActivity(`⛔ Sorting canceled (${result.position}/${videoCount} sorted in ${totalTime}s)`);
            stopSort = false;
        } else if (result.success) {
            if (actualSorted < reportedVideoCount) {
                // Some videos couldn't be sorted due to DOM limit
                const remaining = reportedVideoCount - actualSorted;
                logActivity(`✅ Sorted ${actualSorted}/${reportedVideoCount} videos in ${totalTime}s (${result.moveCount} moves). YouTube's DOM limit prevents sorting all videos at once. Scroll to around video #${Math.floor(actualSorted / 2)} and run sort again to continue.`);
            } else {
                logActivity(`✅ Sorting complete! ${actualSorted} videos sorted in ${totalTime}s with ${result.moveCount} moves`);
            }
            document.scrollingElement.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            if (actualSorted < reportedVideoCount) {
                const remaining = reportedVideoCount - actualSorted;
                logActivity(`⚠️ Partial sort: ${actualSorted}/${reportedVideoCount} sorted in ${totalTime}s (${result.moveCount} moves). ${remaining} videos remain. Scroll to around video #${Math.floor(actualSorted / 2)} and run sort again.`);
            } else {
                logActivity(`⚠️ Partial sort: ${result.position}/${videoCount} videos sorted in ${totalTime}s`);
            }
        }

        // Reset error tracker
        errorTracker.consecutiveErrors = 0;
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

            const checkInterval = setInterval(() => {
                if (isYouTubePageReady()) {
                    logActivity('✓ Ready to sort');
                    clearInterval(checkInterval);
                }
            }, 1000);
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

