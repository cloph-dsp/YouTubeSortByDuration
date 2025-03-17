/**

/* jshint esversion: 8 */
// ==UserScript==
// @name              YT Playlist Sorter
// @namespace         https://github.com/KohGeek/SortYoutubePlaylistByDuration
// @version           4.0
// @description       Sorts youtube playlist by duration
// @author            cloph-dsp
// @originalAuthor    KohGeek
// @license           GPL-2.0-only
// @match             http://*.youtube.com/*
// @match             https://*.youtube.com/*
// @require           https://greasyfork.org/scripts/374849-library-onelementready-es7/code/Library%20%7C%20onElementReady%20ES7.js
// @supportURL        https://github.com/KohGeek/SortYoutubePlaylistByDuration/
// @grant             none
// @run-at            document-start
// ==/UserScript==

// CSS styles
const css = `
        .sort-playlist-div {
            font-size: 12px;
            padding: 3px 1px;
            display: flex;
            align-items: center;
        }
        .sort-playlist {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .sort-playlist-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .sort-button-toggle {
            border: 1px solid #a0a0a0;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .sort-button-start {
            background-color: #30d030;
            color: white;
        }
        .sort-button-stop {
            background-color: #d03030;
            color: white;
        }
        .sort-button-start:hover {
            background-color: #28b828;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .sort-button-stop:hover {
            background-color: #b82828;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .sort-select {
            border: 1px solid #a0a0a0;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 14px;
            background-color: #f8f8f8;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .sort-select:hover {
            border-color: #666;
            background-color: #f0f0f0;
        }
        .sort-select:focus {
            outline: none;
            border-color: #30d030;
            box-shadow: 0 0 0 2px rgba(48, 208, 48, 0.2);
        }
        .sort-log {
            padding: 8px;
            margin-top: 8px;
            border-radius: 5px;
            background-color: #202020;
            color: #e0e0e0;
            font-size: 13px;
        }
    `

const modeAvailable = [
    { value: 'asc', label: 'by Shortest' },
    { value: 'desc', label: 'by Longest' }
];

const debug = false;

// Config
let isSorting = false;
let scrollLoopTime = 500;
let useAdaptiveDelay = true;
let baseDelayPerVideo = 5;
let minDelay = 10;
let maxDelay = 1000;
let fastModeThreshold = 200;

let sortMode = 'asc';
let autoScrollInitialVideoList = true;
let log = document.createElement('div');
let stopSort = false;

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

// Scroll to position or page bottom
let autoScroll = async (scrollTop = null) => {
    let element = document.scrollingElement;
    let scrollDestination = scrollTop !== null ? scrollTop : element.scrollHeight;
    let startPosition = element.scrollTop;

    logActivity(`Scrolling page... 📜`);
    
    // Use stepped approach for longer scrolls
    if (Math.abs(startPosition - scrollDestination) > 3000) {
        const totalSteps = 4;
        const stepSize = (scrollDestination - startPosition) / totalSteps;
        
        for (let i = 1; i <= totalSteps && !stopSort; i++) {
            const intermediatePosition = startPosition + (stepSize * i);
            
            element.scrollTo({
                top: intermediatePosition,
                behavior: 'smooth'
            });
            
            await new Promise(r => setTimeout(r, Math.max(350, scrollLoopTime * 0.5)));
        }
        
        // Final adjustment
        if (Math.abs(element.scrollTop - scrollDestination) > 50 && !stopSort) {
            element.scrollTop = scrollDestination;
            await new Promise(r => setTimeout(r, Math.max(500, scrollLoopTime * 0.6)));
        }
    } else {
        // For shorter distances
        try {
            element.scrollTo({
                top: scrollDestination,
                behavior: 'smooth'
            });
            
            await new Promise(r => setTimeout(r, Math.max(350, scrollLoopTime * 0.6)));
            
            if (Math.abs(element.scrollTop - scrollDestination) > 50 && !stopSort) {
                element.scrollTop = scrollDestination;
                await new Promise(r => setTimeout(r, Math.max(450, scrollLoopTime * 0.7)));
            }
        } catch (e) {
            element.scrollTop = scrollDestination;
            await new Promise(r => setTimeout(r, Math.max(550, scrollLoopTime * 0.8)));
        }
    }
};

// Log message to UI
let logActivity = (message) => {
    log.innerText = message;
    if (debug) {
        console.log(message);
    }
};

// Create UI container
let renderContainerElement = () => {
    const element = document.createElement('div')
    element.className = 'sort-playlist sort-playlist-div'
    element.style.paddingBottom = '16px'

    const controlsContainer = document.createElement('div')
    controlsContainer.className = 'sort-playlist-controls'
    element.appendChild(controlsContainer)

    document.querySelector('div.thumbnail-and-metadata-wrapper').append(element)
}

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
    element.oninput = (e) => { scrollLoopTime = +(e.target.value) };

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

// Wait for YouTube to process drag
let waitForYoutubeProcessing = async () => {
    const maxWaitTime = Math.max(scrollLoopTime * 3, 1000);
    const startTime = Date.now();
    let isProcessed = false;
    
    logActivity(`Rearranging playlist... ⏳`);
    
    // Fast polling
    const pollInterval = Math.min(50, Math.max(25, scrollLoopTime * 0.1));
    
    while (!isProcessed && Date.now() - startTime < maxWaitTime && !stopSort) {
        await new Promise(r => setTimeout(r, pollInterval));
        
        const allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        const currentItems = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
        
        if (allDragPoints.length > 0 && currentItems.length > 0 && 
            document.querySelectorAll('.ytd-continuation-item-renderer').length === 0) {
            isProcessed = true;
            const timeTaken = Date.now() - startTime;
            if (timeTaken > 1000) {
                logActivity(`Video moved successfully ✓`);
            }
            
            // Stabilization wait
            await new Promise(r => setTimeout(r, Math.min(180, scrollLoopTime * 0.25)));
            return true;
        }
    }
    
    // Recovery methods

    // Fast recovery approach
    if (!isProcessed) {
        logActivity(`Ensuring YouTube updates... ⏱️`);
        
        // Click body to refocus
        document.body.click();
        await new Promise(r => setTimeout(r, 275));
        
        // Check results
        let updatedDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        let allThumbnails = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
        
        if (updatedDragPoints.length > 0 && allThumbnails.length > 0) {
            logActivity(`Recovered playlist view ✓`);
            await new Promise(r => setTimeout(r, 540));
            
            // Force refresh
            window.dispatchEvent(new Event('resize'));
            await new Promise(r => setTimeout(r, 180));
            
            return true;
        }
        
        // Try faster recovery (2 attempts)
        for (let i = 0; i < 2 && !stopSort; i++) {
            const areas = [
                document.querySelector('.playlist-items'), 
                document.body
            ];
            
            // Click areas
            for (const area of areas) {
                if (area && !stopSort) {
                    area.click();
                    await new Promise(r => setTimeout(r, 125));
                }
            }
            
            // Slight scroll
            if (!stopSort) {
                const scrollElem = document.scrollingElement;
                const currentPos = scrollElem.scrollTop;
                scrollElem.scrollTop = currentPos + 10; 
                await new Promise(r => setTimeout(r, 125));
                scrollElem.scrollTop = currentPos;
            }
            
            // Check if successful
            updatedDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
            allThumbnails = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
            
            if (updatedDragPoints.length > 0 && allThumbnails.length > 0) {
                logActivity(`Recovered after attempt ${i+1} ✓`);
                await new Promise(r => setTimeout(r, (540 + i * 125)));
                
                // Force refresh
                window.dispatchEvent(new Event('resize'));
                await new Promise(r => setTimeout(r, 175));
                
                return true;
            }
            
            await new Promise(r => setTimeout(r, 315 + i * 175));
        }
        
        // Final fallback
        if (!stopSort) {
            logActivity(`Attempting final recovery method...`);
            
            document.body.click();
            await new Promise(r => setTimeout(r, 225));
            
            const playlistHeader = document.querySelector('ytd-playlist-header-renderer');
            if (playlistHeader) playlistHeader.click();
            
            await new Promise(r => setTimeout(r, 725));
            // Final check
            updatedDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
            allThumbnails = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
            if (updatedDragPoints.length > 0 && allThumbnails.length > 0) {
                logActivity(`Final recovery successful ✓`);
                await new Promise(r => setTimeout(r, 700)); 
                // Force refresh
                window.dispatchEvent(new Event('resize'));
                await new Promise(r => setTimeout(r, 175));
                return true;
            }
            logActivity(`Recovery failed - skipping operation`);
            return false;
        }
    }
    return isProcessed;
};

// Check if playlist is fully loaded
let isPlaylistFullyLoaded = (reportedCount, loadedCount) => {
    const hasSpinner = document.querySelector('.ytd-continuation-item-renderer') !== null;
    return reportedCount === loadedCount && !hasSpinner;
};

// Check if YouTube page is ready
let isYouTubePageReady = () => {
    const playlistContainer = document.querySelector("ytd-item-section-renderer:first-of-type");
    const videoCount = document.querySelector(".metadata-stats span.yt-formatted-string:first-of-type");
    const dragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
    
    // Spinner detection
    const spinnerElements = document.querySelectorAll('.ytd-continuation-item-renderer, yt-icon-button.ytd-continuation-item-renderer, .circle.ytd-spinner');
    const hasVisibleSpinner = Array.from(spinnerElements).some(el => {
        const rect = el.getBoundingClientRect();
        return (rect.width > 0 && rect.height > 0 && 
                rect.top >= 0 && rect.top <= window.innerHeight);
    });
    
    const reportedCount = videoCount ? Number(videoCount.innerText) : 0;
    const loadedCount = dragPoints.length;
    const youtubeLoadLimit = 100;
    
    // Check readiness
    const basicElementsReady = playlistContainer && videoCount && loadedCount > 0;
    const hasEnoughVideos = loadedCount >= 95 || loadedCount === reportedCount;
    const fullyLoaded = (!hasVisibleSpinner && hasEnoughVideos) || 
                         (loadedCount >= 0.97 * Math.min(reportedCount, youtubeLoadLimit));
    
    const isReady = basicElementsReady && fullyLoaded;
    
    // Show status
    if (isReady) {
        if (loadedCount < reportedCount) {
            logActivity(`✅ Ready: ${loadedCount}/${reportedCount} videos (YouTube limit reached)`);
        } else {
            logActivity(`✅ Ready: ${loadedCount}/${reportedCount} videos`);
        }
    } else if (basicElementsReady) {
        if (hasVisibleSpinner) {
            logActivity(`⏳ Loading: ${loadedCount}/${reportedCount} videos`);
        } else if (loadedCount < reportedCount) {
            logActivity(`⚠️ Some videos unavailable: ${loadedCount}/${reportedCount}`);
        } else {
            logActivity(`⌛ Waiting: ${loadedCount} videos`);
        }
    } else {
        logActivity(`🔄 Waiting: ${loadedCount}/${reportedCount || '?'} videos`);
    }
    return isReady;
};

// Sort videos by duration
let sortVideos = (allAnchors, allDragPoints, expectedCount) => {
    let videos = [];
    let sorted = 0;
    let dragged = false;
    
    if (allDragPoints.length !== expectedCount || allAnchors.length !== expectedCount) {
        logActivity("Playlist not fully loaded, waiting...");
        return 0;
    }
    
    // Get duration for each video
    for (let j = 0; j < allDragPoints.length; j++) {
        let thumb = allAnchors[j];
        let drag = allDragPoints[j];
        let timeSpan = thumb.querySelector("#text");
        let timeDigits = timeSpan.innerText.trim().split(":").reverse();
        let time;
        if (timeDigits.length == 1) {
            sortMode == "asc" ? time = 999999999999999999 : time = -1;
        } else {
            time = parseInt(timeDigits[0]);
            if (timeDigits[1]) time += parseInt(timeDigits[1]) * 60;
            if (timeDigits[2]) time += parseInt(timeDigits[2]) * 3600;
        }
        videos.push({ anchor: drag, time: time, originalIndex: j });
    }
    
    // Sort by duration
    if (sortMode == "asc") {
        videos.sort((a, b) => a.time - b.time);
    } else {
        videos.sort((a, b) => b.time - a.time);
    }
    
    // Drag operations
    for (let j = 0; j < videos.length; j++) {
        let originalIndex = videos[j].originalIndex;

        if (debug) {
            console.log("Loaded: " + videos.length + ". Current: " + j + ". Original: " + originalIndex + ".");
        }

        if (originalIndex !== j) {
            let elemDrag = videos[j].anchor;
            let elemDrop = videos.find((v) => v.originalIndex === j).anchor;

            logActivity("Drag " + originalIndex + " to " + j);
            simulateDrag(elemDrag, elemDrop);
            dragged = true;
        }

        sorted = j;

        if (stopSort || dragged) {
            break;
        }
    }

    return sorted;
}

// Main sorting function
let activateSort = async () => {
    // Set manual sorting mode
    const ensureManualSort = async () => {
        const sortButton = document.querySelector('yt-dropdown-menu[icon-label="Ordenar"] tp-yt-paper-button, yt-dropdown-menu[icon-label="Sort"] tp-yt-paper-button');
        if (!sortButton) {
            logActivity("Sort dropdown not found. Using current mode.");
            return;
        }
        
        sortButton.click();
        await new Promise(r => setTimeout(r, 300));
        
        const manualOption = document.querySelector('tp-yt-paper-listbox a:first-child tp-yt-paper-item');
        if (manualOption) {
            manualOption.click();
            logActivity("Switched to Manual sort mode");
            await new Promise(r => setTimeout(r, 500));
        } else {
            logActivity("Manual sort option not found. Using current mode.");
        }
    };

    await ensureManualSort();
    let reportedVideoCount = Number(document.querySelector(".metadata-stats span.yt-formatted-string:first-of-type").innerText);
    let allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
    let allAnchors;
    
    // Set optimal delay based on playlist size
    if (useAdaptiveDelay) {
        const needsScrolling = reportedVideoCount > 95 && allDragPoints.length < reportedVideoCount && autoScrollInitialVideoList;
        
        if (needsScrolling) {
            scrollLoopTime = Math.max(500, minDelay * 8);
            logActivity(`Using scroll-safe speed (${scrollLoopTime}ms)`);
        } else {
            let videoCount = reportedVideoCount || allDragPoints.length;
            
            if (videoCount <= fastModeThreshold) {
                let fastDelay = Math.max(75, baseDelayPerVideo * Math.sqrt(videoCount * 0.75));
                scrollLoopTime = Math.min(fastDelay, 350);
                logActivity(`Using fast mode: ${scrollLoopTime}ms}`);
            } else {
                let calculatedDelay = Math.max(100, baseDelayPerVideo * Math.log(videoCount) * 2.5);
                scrollLoopTime = Math.min(calculatedDelay, 800);
                logActivity(`Using adaptive delay: ${scrollLoopTime}ms}`);
            }
        }
    }
    
    let sortedCount = 0;
    let initialVideoCount = allDragPoints.length;
    let scrollRetryCount = 0;
    stopSort = false;
    let consecutiveRecoveryFailures = 0;

    // Load all videos
    while (reportedVideoCount !== initialVideoCount
        && document.URL.includes("playlist?list=")
        && stopSort === false
        && autoScrollInitialVideoList === true) {
        logActivity(`Loading videos (${allDragPoints.length}/${reportedVideoCount})`);
        if (scrollRetryCount > 5) {
            break;
        } else if (scrollRetryCount > 0) {
            logActivity(`Some videos may be unavailable. Attempt: ${scrollRetryCount}/5`);
        }
        
        // Show appropriate warning based on playlist size
        if (allDragPoints.length > 600) {
            logActivity(`${allDragPoints.length} videos - large playlist warning (may take several minutes)`);
        } else if (allDragPoints.length > 300) {
            logActivity(`${allDragPoints.length} videos - this may take a while`);
        }
        
        await autoScroll();
        allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        initialVideoCount = allDragPoints.length;

        if (((reportedVideoCount - initialVideoCount) / 10) < 1) {
            scrollRetryCount++;
        }
    }
    logActivity(initialVideoCount + " videos loaded.");
    if (scrollRetryCount > 5) logActivity(log.innerText + "\nMax scroll attempts reached. Proceeding with available videos.");
    let loadedLocation = document.scrollingElement.scrollTop;
    scrollRetryCount = 0;

    // Sort videos
    const sortStartTime = Date.now();
    const maxSortTime = 900000; // 15 minutes max

    // Check timeout
    if (Date.now() - sortStartTime > maxSortTime) {
        logActivity("Sorting timed out after 15 minutes.");
        return;
    }
    
    while (sortedCount < initialVideoCount && stopSort === false) {
        // Check timeout
        if (Date.now() - sortStartTime > maxSortTime) {
            logActivity("Sorting timed out after 15 minutes.");
            return;
        }
        
        // Reset after recovery failures
        if (consecutiveRecoveryFailures >= 3) {
            logActivity("Too many failures. Reattempting...");
            await new Promise(r => setTimeout(r, 1500));
            consecutiveRecoveryFailures = 0;
        }
        allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        allAnchors = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
        scrollRetryCount = 0;

        // Ensure durations loaded
        while (!allAnchors[initialVideoCount - 1]?.querySelector("#text") && stopSort === false) {
            if (document.scrollingElement.scrollTop < loadedLocation && scrollRetryCount < 3) {
                logActivity(`Loading details... (${sortedCount + 1}/${initialVideoCount})`);
                await autoScroll(loadedLocation);
                scrollRetryCount++;
            } else {
                logActivity(`Scrolling for content...`);
                await autoScroll();
            }
            // Refresh references
            allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
            allAnchors = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
            if (allAnchors.length === 0 || allDragPoints.length === 0) {
                logActivity("Lost video references. Waiting...");
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // Sort if elements available
        if (allAnchors.length > 0 && allDragPoints.length > 0) {
            sortedCount = Number(sortVideos(allAnchors, allDragPoints, initialVideoCount) + 1);
            const processingSuccessful = await waitForYoutubeProcessing();
            if (!processingSuccessful) {
                logActivity("Recovery failed - waiting...");
                consecutiveRecoveryFailures++;
                await new Promise(r => setTimeout(r, 1000 + (consecutiveRecoveryFailures * 300)));
                continue;
            } else {
                consecutiveRecoveryFailures = 0;
            }
        } else {
            logActivity("No video elements. Waiting...");
            await new Promise(r => setTimeout(r, 1500));
            consecutiveRecoveryFailures++;
        }
    }
    
    // Final status
    if (stopSort === true) {
        logActivity("Sorting canceled ⛔");
        stopSort = false;
    } else {
        logActivity(`Sorting complete ✓ (${sortedCount} videos)`);
    }
};

// Initialize UI
let init = () => {
    onElementReady('div.thumbnail-and-metadata-wrapper', false, () => {
        autoScrollInitialVideoList = true;
        useAdaptiveDelay = true;
        
        renderContainerElement();
        addCssStyle();
        renderToggleButton();
        renderSelectElement(0, modeAvailable, 'Sort Order');
        renderLogElement();
        
        // Check page loading
        const checkPageInterval = setInterval(() => {
            if (isYouTubePageReady()) {
                logActivity("✓ Ready to sort");
                clearInterval(checkPageInterval);
            }
        }, 1000);
    });
};

// Initialize script
(() => {
    init();
    navigation.addEventListener('navigate', navigateEvent => {
        const url = new URL(navigateEvent.destination.url);
        if (url.pathname.includes('playlist?')) init();
    });
})();
