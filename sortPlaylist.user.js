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
    
    // Enhanced timing configuration
    const TIMING_CONFIG = {
        scrollDelay: 400, // Base delay for scrolling
        scrollRetryDelay: 800, // Delay when retrying scroll
        dragBaseDelay: 100, // Minimum delay between drags
        dragProcessDelay: 150, // Wait for drag animation to start
        dragStabilizationDelay: 400, // Wait for DOM to stabilize
        maxWaitTime: 5000, // Maximum time to wait for YouTube (increased for reliability)
        pollInterval: 100, // Polling interval for state checks
        recoveryDelay: 1000, // Delay for recovery attempts
        adaptiveMultiplier: 1.5 // Multiplier for adaptive delays
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
        await sleep(TIMING_CONFIG.dragProcessDelay);
        
        // Poll for stability - check if DOM has stabilized
        const startTime = Date.now();
        let lastItemCount = 0;
        let stableChecks = 0;
        const playlistContainer = document.querySelector("ytd-playlist-video-list-renderer");
        
        while (Date.now() - startTime < TIMING_CONFIG.maxWaitTime && !stopSort) {
            const currentItems = playlistContainer ? playlistContainer.querySelectorAll("yt-icon#reorder").length : 0;
            
            // Check if count is stable (hasn't changed)
            if (currentItems === lastItemCount && currentItems > 0) {
                stableChecks++;
                // If stable for 2 checks, we're done
                if (stableChecks >= 2) {
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
            
            await sleep(TIMING_CONFIG.pollInterval);
        }
        
        // Additional stabilization wait
        await sleep(TIMING_CONFIG.dragStabilizationDelay);
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
     
    // Enhanced video parsing with error handling
    const parseVideoDuration = (anchor, index) => {
        try {
            const txtElem = anchor.querySelector('#text');
            if (!txtElem || !txtElem.innerText) {
                // Don't spam console - missing durations are normal for lazy-loaded videos
                return sortMode === 'asc' ? Infinity : -Infinity;
            }
            
            const timeSp = txtElem.innerText.trim().split(':').reverse();
            
            // Handle non-timestamped videos (live, premiere, etc.)
            if (timeSp.length === 1) {
                return sortMode === 'asc' ? Infinity : -Infinity;
            }
            
            const seconds = parseInt(timeSp[0]) || 0;
            const minutes = timeSp[1] ? parseInt(timeSp[1]) * 60 : 0;
            const hours = timeSp[2] ? parseInt(timeSp[2]) * 3600 : 0;
            
            return seconds + minutes + hours;
        } catch (error) {
            console.error(`Error parsing video ${index + 1} duration:`, error);
            return sortMode === 'asc' ? Infinity : -Infinity;
        }
    };
    
    // Helper: read playlist items robustly and return array with id, duration, element, and drag handle
    const getPlaylistItems = (playlistContainer) => {
        const items = Array.from(playlistContainer.querySelectorAll('ytd-playlist-video-renderer'));
        const result = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Thumbnail anchor that usually contains the watch URL
            const thumb = item.querySelector('a#thumbnail');
            let videoId = null;
            if (thumb) {
                const href = thumb.getAttribute('href') || '';
                const m = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                if (m) videoId = m[1];
                else {
                    // Try /shorts/ or other URL forms
                    const s = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                    if (s) videoId = s[1];
                }
            }

            // Duration is inside ytd-thumbnail-overlay-time-status-renderer
            // Find the span with id="text" inside the time overlay
            const timeOverlay = item.querySelector('ytd-thumbnail-overlay-time-status-renderer span#text');
            let duration = sortMode === 'asc' ? Infinity : -Infinity;
            
            if (timeOverlay && timeOverlay.innerText) {
                const timeSp = timeOverlay.innerText.trim().split(':').reverse();
                if (timeSp.length > 1) {
                    const seconds = parseInt(timeSp[0]) || 0;
                    const minutes = timeSp[1] ? parseInt(timeSp[1]) * 60 : 0;
                    const hours = timeSp[2] ? parseInt(timeSp[2]) * 3600 : 0;
                    duration = seconds + minutes + hours;
                }
            }

            // Drag handle (reorder icon)
            const dragHandle = item.querySelector('yt-icon#reorder');

            result.push({ id: videoId || `unknown-${i}`, duration, item, dragHandle, index: i });
        }

        return result;
    };

    // Sort videos using optimized insertion sort algorithm
    // This algorithm minimizes DOM operations and maintains stable progress tracking
    const sortVideos = (allAnchors, allDragPoints, expectedCount, currentPass = 0) => {
        let videos = [];
        let positionChecked = 0; // Track which position we're checking (stable progress)
        let dragged = false;

        // Check what's available in DOM
        const actualCount = Math.min(allDragPoints.length, allAnchors.length);
        if (actualCount < expectedCount * 0.9 || actualCount < 5) {
            logActivity(`⏳ Waiting for more items (${actualCount}/${expectedCount})...`);
            return { sorted: positionChecked, dragged };
        }
        
        // CRITICAL: NEVER work with more than expectedCount items
        const workingCount = Math.min(actualCount, expectedCount);

        // Build list with current DOM positions and durations
        for (let j = 0; j < workingCount; j++) {
            let thumb = allAnchors[j];
            let drag = allDragPoints[j];

            let timeSpan = thumb.querySelector("ytd-thumbnail-overlay-time-status-renderer span#text");
            let timeDigits = timeSpan ? timeSpan.innerText.trim().split(":").reverse() : [];
            let time;
            
            if (timeDigits.length == 1 || !timeSpan) {
                time = sortMode == "asc" ? 999999999999999999 : -1;
            } else {
                time = parseInt(timeDigits[0]) || 0;
                if (timeDigits[1]) time += parseInt(timeDigits[1]) * 60;
                if (timeDigits[2]) time += parseInt(timeDigits[2]) * 3600;
            }
            videos.push({ 
                anchor: drag, 
                time: time, 
                currentPosition: j // Track current position in DOM
            });
        }

        // Create sorted reference array (what the order SHOULD be)
        let sortedVideos = [...videos].sort((a, b) => {
            return sortMode == "asc" ? a.time - b.time : b.time - a.time;
        });

        // Check each position starting from where we left off in this pass
        for (let targetPos = currentPass; targetPos < videos.length; targetPos++) {
            positionChecked = targetPos;
            
            // Check if video at targetPos is correct
            const currentVideo = videos[targetPos];
            const targetVideo = sortedVideos[targetPos];
            
            // Compare by duration (since object references change)
            if (currentVideo.time !== targetVideo.time) {
                // Find where the correct video currently is
                // Must search ALL positions, not just after targetPos
                let sourcePos = -1;
                for (let i = 0; i < videos.length; i++) {
                    if (i !== targetPos && videos[i].time === targetVideo.time) {
                        sourcePos = i;
                        break;
                    }
                }
                
                if (sourcePos === -1) {
                    // Could be a duplicate duration - find first occurrence that's not at targetPos
                    for (let i = 0; i < videos.length; i++) {
                        if (videos[i].time === targetVideo.time && i !== targetPos) {
                            // Check if this video has the same anchor reference
                            if (videos[i].anchor !== currentVideo.anchor) {
                                sourcePos = i;
                                break;
                            }
                        }
                    }
                }
                
                if (sourcePos === -1) {
                    // Still can't find it - might be at the target already after previous drag
                    console.log(`Warning: Could not find video with time ${targetVideo.time} for position ${targetPos}`);
                    continue;
                }
                
                // SAFETY CHECK: Ensure positions are within bounds
                if (sourcePos >= expectedCount || targetPos >= expectedCount) {
                    logActivity(`⚠️ Position out of bounds: source=${sourcePos + 1}, target=${targetPos + 1}`);
                    continue;
                }
                
                // Verify elements exist
                const elemDrag = videos[sourcePos].anchor;
                const elemDrop = videos[targetPos].anchor;
                
                if (!elemDrag || !elemDrop) {
                    logActivity(`⚠️ Missing drag elements at position ${targetPos + 1}, skipping...`);
                    continue;
                }

                // Perform ONE drag operation: move video from sourcePos directly to targetPos
                logActivity(`🔄 Moving video from position ${sourcePos + 1} → ${targetPos + 1}`);
                simulateDrag(elemDrag, elemDrop);
                
                dragged = true;
                break; // Only do ONE drag per iteration, then re-read DOM
            }

            if (stopSort) {
                break;
            }
        }

        // Return the position checked (stable progress) and whether we made a swap
        return { sorted: positionChecked, dragged };
    };
    
    // Helper function to format duration for display
    const formatDuration = (seconds) => {
        if (seconds === Infinity || seconds === -Infinity) return 'N/A';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };
     
    // Main sorting function with comprehensive improvements
    const activateSort = async () => {
        // Reset error tracking
        errorTracker.consecutiveErrors = 0;
        errorTracker.totalErrors = 0;
        stopSort = false;
        isPaused = false;
        
        const sortStartTime = Date.now();
        const maxSortTime = 1800000; // 30 minutes max
        
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
        
        // Load all videos using enhanced scrolling
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
        
        // Use the reported count (from YouTube's counter) as the actual count
        // The loaded count may include extra elements or duplicates
        const initialVideoCount = Math.min(reportedVideoCount, loadedVideoCount);
        
        logActivity(`✅ ${initialVideoCount} videos ready for sorting (${loadedVideoCount} loaded)`);
        
        // Scroll to top for better stability
        document.scrollingElement.scrollTop = 0;
        await sleep(500);
        
        // Ensure video details are loaded
        logActivity(`🔍 Verifying video details...`);
        let allAnchors = playlistContainer.querySelectorAll("div#content a#thumbnail.inline-block.ytd-thumbnail");
        let allDragPoints = playlistContainer.querySelectorAll("yt-icon#reorder");
        
        // Scroll through the list to ensure all durations are loaded
        let detailRetries = 0;
        const maxDetailRetries = 5;
        
        while (detailRetries < maxDetailRetries && !stopSort) {
            allAnchors = playlistContainer.querySelectorAll("div#content a#thumbnail.inline-block.ytd-thumbnail");
            allDragPoints = playlistContainer.querySelectorAll("yt-icon#reorder");
            
            logActivity(`🔍 Found ${allAnchors.length} anchors, ${allDragPoints.length} drag points (need ${initialVideoCount})`);
            
            if (allAnchors.length < initialVideoCount || allDragPoints.length < initialVideoCount) {
                logActivity(`⏳ Loading video details... (${Math.min(allAnchors.length, allDragPoints.length)}/${initialVideoCount})`);
                
                // Scroll to bottom to load everything
                const scrollElem = document.scrollingElement;
                scrollElem.scrollTop = scrollElem.scrollHeight;
                await sleep(600);
                detailRetries++;
            } else {
                // Check if durations are loaded for key videos
                const firstAnchor = allAnchors[0];
                const middleAnchor = allAnchors[Math.floor(initialVideoCount / 2)];
                const lastAnchor = allAnchors[initialVideoCount - 1];
                
                const hasFirstDuration = firstAnchor && firstAnchor.querySelector("#text");
                const hasMiddleDuration = middleAnchor && middleAnchor.querySelector("#text");
                const hasLastDuration = lastAnchor && lastAnchor.querySelector("#text");
                
                if (hasFirstDuration && hasMiddleDuration && hasLastDuration) {
                    logActivity(`✅ All video details loaded`);
                    break;
                }
                
                logActivity(`⏳ Waiting for duration data... (retry ${detailRetries + 1}/${maxDetailRetries})`);
                
                // Scroll through the list
                const scrollElem = document.scrollingElement;
                scrollElem.scrollTop = scrollElem.scrollHeight;
                await sleep(800);
                detailRetries++;
            }
        }
        
        if (detailRetries >= maxDetailRetries) {
            logActivity(`⚠️ Proceeding with available data (some durations may be missing)`);
        }
        
        // Scroll back to top
        document.scrollingElement.scrollTop = 0;
        await sleep(500);
        
        // Main sorting loop
        let sortedCount = 0;
        let iterationCount = 0;
        const maxIterations = initialVideoCount * initialVideoCount; // Worst case: N^2 for selection sort
        let lastScrollRefresh = Date.now();
        let stuckCount = 0; // Track how many times we're stuck at the same position
        let lastSortedCount = 0;
        let consecutiveNoSwaps = 0; // Track complete passes with no swaps
        let lastDragPosition = -1; // Track the last position we tried to drag
        let sameDragAttempts = 0; // Count consecutive attempts at same position
        let currentPassPosition = 0; // Track where we are in the current sorting pass
        
        logActivity(`🚀 Starting sort...`);
        
        while (sortedCount < initialVideoCount && !stopSort && iterationCount < maxIterations) {
            iterationCount++;
            
            // Check timeout
            if (Date.now() - sortStartTime > maxSortTime) {
                logActivity("⏰ Sorting timed out after 30 minutes");
                break;
            }
            
            // Wait for YouTube to fully process previous drag and update DOM
            // MUST do this BEFORE checking if DOM refresh is needed
            await waitForYoutubeProcessing();
            
            // CRITICAL: Check if we need to refresh DOM to keep all items loaded
            // Do this AFTER waiting to ensure previous drag is complete
            const currentLoadedItems = playlistContainer.querySelectorAll("yt-icon#reorder").length;
            if (currentLoadedItems < initialVideoCount * 0.9 || (sortedCount > 80 && currentLoadedItems < initialVideoCount)) {
                logActivity(`🔄 Refreshing DOM (${currentLoadedItems}/${initialVideoCount} items visible)...`);
                
                // Scroll to bottom to load all items
                document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
                await sleep(800); // Increased from 600ms
                document.scrollingElement.scrollTop = 0;
                await sleep(600); // Increased from 400ms
                
                // Verify items reloaded
                const reloadedItems = playlistContainer.querySelectorAll("yt-icon#reorder").length;
                logActivity(`✅ DOM refreshed (${reloadedItems}/${initialVideoCount} items now visible)`);
                
                // CRITICAL: Wait again after refresh to ensure DOM is stable
                await waitForYoutubeProcessing();
            }
            
            // Periodically refresh the DOM by scrolling to keep all items loaded
            // YouTube unloads items that aren't visible, so we need to scroll every ~30 moves
            if (iterationCount % 30 === 0 && iterationCount > 0) {
                logActivity(`🔄 Periodic DOM refresh at iteration ${iterationCount}...`);
                
                // Quick scroll to bottom and back
                document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
                await sleep(600);
                document.scrollingElement.scrollTop = 0;
                await sleep(400);
                
                lastScrollRefresh = Date.now();
            }
            
            // Refresh element references; be permissive — sortVideos will handle partial DOM
            let allDragPointsCheck = playlistContainer.querySelectorAll("yt-icon#reorder");
            let allAnchorsCheck = playlistContainer.querySelectorAll("div#content a#thumbnail.inline-block.ytd-thumbnail");

            // If too few items are visible, give the DOM a short chance to recover before proceeding
            if (allDragPointsCheck.length < Math.max(5, Math.min(initialVideoCount, 25))) {
                let quickRetries = 0;
                while (quickRetries < 6 && allDragPointsCheck.length < Math.max(5, Math.min(initialVideoCount, 25)) && !stopSort) {
                    logActivity(`⏳ Waiting for more items to render... (${allDragPointsCheck.length}/${initialVideoCount})`);
                    await sleep(500);
                    allDragPointsCheck = playlistContainer.querySelectorAll("yt-icon#reorder");
                    allAnchorsCheck = playlistContainer.querySelectorAll("div#content a#thumbnail.inline-block.ytd-thumbnail");
                    quickRetries++;
                }
            }
            
            // Perform ONE sort operation - find and move one misplaced video
            let allDragPointsRaw = playlistContainer.querySelectorAll("yt-icon#reorder");
            let allAnchorsRaw = playlistContainer.querySelectorAll("div#content a#thumbnail.inline-block.ytd-thumbnail");
            
            // CRITICAL: Convert NodeLists to arrays and slice to only include first initialVideoCount items
            // This prevents reading beyond the playlist boundaries when DOM has extra elements
            const allDragPoints = Array.from(allDragPointsRaw).slice(0, initialVideoCount);
            const allAnchors = Array.from(allAnchorsRaw).slice(0, initialVideoCount);
            
            const result = sortVideos(allAnchors, allDragPoints, initialVideoCount, currentPassPosition);
            const previousSortedCount = sortedCount;
            sortedCount = result.sorted + 1;
            const didSwap = result.dragged;
            
            // Update where we are in the current pass
            if (didSwap) {
                // We made a change at this position, continue from here next iteration
                currentPassPosition = result.sorted;
            } else {
                // No swap needed, advance to next position
                currentPassPosition = result.sorted + 1;
            }
            
            // Detect if we're trying the same drag repeatedly (means it's failing)
            if (didSwap) {
                if (result.sorted === lastDragPosition) {
                    sameDragAttempts++;
                    if (sameDragAttempts >= 3) {
                        logActivity(`⚠️ Drag at position ${result.sorted + 1} failed ${sameDragAttempts} times, restarting pass...`);
                        // Force a complete DOM reload and wait longer
                        document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
                        await sleep(1500);
                        document.scrollingElement.scrollTop = 0;
                        await sleep(1000);
                        
                        // Wait for DOM to fully stabilize
                        await waitForYoutubeProcessing();
                        
                        // Reset and restart the entire pass from position 0
                        // This ensures we re-read the DOM with fresh positions
                        sameDragAttempts = 0;
                        lastDragPosition = -1;
                        sortedCount = 0;
                        currentPassPosition = 0; // Start over from beginning
                        logActivity(`🔄 Restarting sort from position 1...`);
                        continue;
                    }
                } else {
                    sameDragAttempts = 0;
                }
                lastDragPosition = result.sorted;
                await sleep(200); // Extra stabilization time after drag
            } else {
                sameDragAttempts = 0;
                lastDragPosition = -1;
            }
            
            // If we completed a full pass without any swaps, we're done!
            if (!didSwap && currentPassPosition >= initialVideoCount) {
                logActivity(`✅ Completed full pass with no swaps - sorting complete!`);
                sortedCount = initialVideoCount; // Mark as 100% complete
                break;
            }
            
            // If we reached the end of a pass, start a new pass from the beginning
            if (currentPassPosition >= initialVideoCount) {
                logActivity(`🔄 Completed pass ${Math.floor(iterationCount / initialVideoCount) + 1}, starting new pass...`);
                currentPassPosition = 0; // Reset to check from start again
                consecutiveNoSwaps = didSwap ? 0 : consecutiveNoSwaps + 1;
            }
            
            // Detect if we're stuck at same position
            if (sortedCount === lastSortedCount && sortedCount > 0) {
                stuckCount++;
                if (stuckCount > 10) {
                    logActivity(`⚠️ Stuck at position ${sortedCount}, forcing DOM refresh...`);
                    // Force a complete DOM reload
                    document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
                    await sleep(1000);
                    document.scrollingElement.scrollTop = 0;
                    await sleep(800);
                    stuckCount = 0; // Reset after refresh
                }
            } else {
                stuckCount = 0; // Reset if we made progress
                lastSortedCount = sortedCount;
            }
            
            const progress = Math.round((sortedCount / initialVideoCount) * 100);
            const elapsed = Math.round((Date.now() - sortStartTime) / 1000);
            const estimatedTotal = elapsed > 0 ? Math.round((elapsed / sortedCount) * initialVideoCount) : 0;
            const remaining = Math.max(0, estimatedTotal - elapsed);
            
            logActivity(`📊 Progress: ${sortedCount}/${initialVideoCount} (${progress}%) | Elapsed: ${elapsed}s | Est: ${remaining}s`);
        }
        
        // Final status
        const totalTime = Math.round((Date.now() - sortStartTime) / 1000);
        
        if (stopSort) {
            logActivity(`⛔ Sorting canceled (${sortedCount}/${initialVideoCount} sorted in ${totalTime}s)`);
            stopSort = false;
        } else if (sortedCount >= initialVideoCount) {
            logActivity(`✅ Sorting complete! ${sortedCount} videos sorted in ${totalTime}s (${errorTracker.totalErrors} errors recovered)`);
            document.scrollingElement.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            logActivity(`⚠️ Partial sort: ${sortedCount}/${initialVideoCount} videos sorted in ${totalTime}s`);
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

