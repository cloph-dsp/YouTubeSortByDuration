/**

/* jshint esversion: 8 */
// ==UserScript==
// @name              YT Playlist Sorter
// @namespace         https://github.com/KohGeek/SortYoutubePlaylistByDuration
// @version           3.5
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
const css =
    `
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

// Sort configuration
let isSorting = false;
let scrollLoopTime = 600; // Base delay value
let useAdaptiveDelay = true; 
let baseDelayPerVideo = 5; // 5ms per video for delay calculation
let minDelay = 5; // Minimum threshold
let maxDelay = 1500; // Maximum cap

let sortMode = 'asc';
let autoScrollInitialVideoList = true;
let log = document.createElement('div');
let stopSort = false;

// Fire a mouse event at specific coordinates
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

// Simulate drag and drop between elements
let simulateDrag = (elemDrag, elemDrop) => {
    // Calculate positions
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

    // Start dragging process
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

    // Complete the drop
    fireMouseEvent("drop", elemDrop, center2X, center2Y);
    fireMouseEvent("dragend", elemDrag, center2X, center2Y);
    fireMouseEvent("mouseup", elemDrag, center2X, center2Y);
};

// Scroll to a specific position or bottom of page
let autoScroll = async (scrollTop = null) => {
    let element = document.scrollingElement;
    let currentScroll = element.scrollTop;
    let scrollDestination = scrollTop !== null ? scrollTop : element.scrollHeight;
    let scrollCount = 0;
    do {
        currentScroll = element.scrollTop;
        element.scrollTop = scrollDestination;
        await new Promise(r => setTimeout(r, scrollLoopTime));
        scrollCount++;
    } while (currentScroll != scrollDestination && scrollCount < 2 && stopSort === false);
};

// Display log message
let logActivity = (message) => {
    log.innerText = message;
    if (debug) {
        console.log(message);
    }
};

// Create the main container for UI elements
let renderContainerElement = () => {
    const element = document.createElement('div')
    element.className = 'sort-playlist sort-playlist-div'
    element.style.paddingBottom = '16px'

    const controlsContainer = document.createElement('div')
    controlsContainer.className = 'sort-playlist-controls'
    element.appendChild(controlsContainer)

    document.querySelector('div.thumbnail-and-metadata-wrapper').append(element)
}

// Create toggle button for sorting
let renderToggleButton = () => {
    const element = document.createElement('button');
    element.id = 'sort-toggle-button';
    element.className = 'style-scope sort-button-toggle sort-button-start';
    element.innerText = 'Sort Videos';
    
    element.onclick = async () => {
        if (!isSorting) {
            // Start sorting
            isSorting = true;
            element.className = 'style-scope sort-button-toggle sort-button-stop';
            element.innerText = 'Stop Sorting';
            await activateSort();
            // Reset button
            isSorting = false;
            element.className = 'style-scope sort-button-toggle sort-button-start';
            element.innerText = 'Sort Videos';
        } else {
            // Stop sorting
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

// Create number input element
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

// Add CSS to the page
let addCssStyle = () => {
    const element = document.createElement('style');
    element.textContent = css;
    document.head.appendChild(element);
};

// Wait for YouTube to process drag operation using polling
let waitForYoutubeProcessing = async () => {
    const maxWaitTime = scrollLoopTime * 8;
    const startTime = Date.now();
    let isProcessed = false;
    
    logActivity(`Rearranging playlist... ⏳`);
    
    // First attempt - normal polling
    while (!isProcessed && Date.now() - startTime < maxWaitTime && !stopSort) {
        await new Promise(r => setTimeout(r, 100));
        
        const allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        const currentItems = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
        
        if (allDragPoints.length > 0 && currentItems.length > 0 && 
            document.querySelectorAll('.ytd-continuation-item-renderer').length === 0) {
            isProcessed = true;
            const timeTaken = Date.now() - startTime;
            if (timeTaken > 1000) {
                logActivity(`Video moved successfully ✓`);
            }
        }
    }
    
    // Enhanced recovery if timeout occurs
    if (!isProcessed) {
        logActivity(`Ensuring YouTube updates... ⏱️`);
        
        // First try clicking body to refocus
        document.body.click();
        await new Promise(r => setTimeout(r, 400));
        
        // Check if that fixed it
        let updatedDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        if (updatedDragPoints.length > 0) {
            logActivity(`Recovered playlist view ✓`);
            return true;
        }
        
        // If not, try more aggressive recovery
        for (let i = 0; i < 3; i++) {
            // Click in different areas of the page
            const areas = [
                document.querySelector('.playlist-items'), // Playlist container
                document.querySelector('ytd-playlist-header-renderer'), // Header
                document.body // Body as fallback
            ];
            
            // Click on each available area
            for (const area of areas) {
                if (area) {
                    area.click();
                    await new Promise(r => setTimeout(r, 300));
                }
            }
            
            // Try scrolling slightly to trigger UI updates
            const scrollElem = document.scrollingElement;
            const currentPos = scrollElem.scrollTop;
            scrollElem.scrollTop = currentPos + 10; 
            await new Promise(r => setTimeout(r, 200));
            scrollElem.scrollTop = currentPos;
            
            // Check if that worked
            updatedDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
            if (updatedDragPoints.length > 0) {
                logActivity(`Recovered after attempt ${i+1} ✓`);
                return true;
            }
            
            // Wait a bit longer on each retry
            await new Promise(r => setTimeout(r, 500 + i * 300));
        }
        
        // Final fallback - force continuation
        logActivity(`Recovery attempts exhausted. Continuing...`);
    }
    
    return true;
};

// Check if playlist is fully loaded
let isPlaylistFullyLoaded = (reportedCount, loadedCount) => {
    const hasSpinner = document.querySelector('.ytd-continuation-item-renderer') !== null;
    return reportedCount === loadedCount && !hasSpinner;
};

// Check if YouTube page is ready for sorting
let isYouTubePageReady = () => {
    const playlistContainer = document.querySelector("ytd-item-section-renderer:first-of-type");
    const videoCount = document.querySelector(".metadata-stats span.yt-formatted-string:first-of-type");
    const dragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
    const hasSpinner = document.querySelector('.ytd-continuation-item-renderer') !== null;
    
    const reportedCount = videoCount ? Number(videoCount.innerText) : 0;
    const loadedCount = dragPoints.length;
    
    const isReady = playlistContainer && videoCount && loadedCount > 0;
    
    if (isReady) {
        logActivity(`Ready to sort: ${loadedCount}/${reportedCount} videos loaded${hasSpinner ? ' (more loading)' : ''}`);
    } else {
        logActivity(`Waiting for page to load: ${loadedCount}/${reportedCount || '?'} videos`);
    }
    
    return isReady;
};

// Sort videos by duration
let sortVideos = (allAnchors, allDragPoints, expectedCount) => {
    let videos = [];
    let sorted = 0;
    let dragged = false;

    if (allDragPoints.length !== expectedCount || allAnchors.length !== expectedCount) {
        logActivity("Playlist is not fully loaded, waiting...");
        return 0;
    }

    // Collect video durations
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

    // Perform the drag operations
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
    // Ensure manual sorting mode
    const ensureManualSort = async () => {
        const sortButton = document.querySelector('yt-dropdown-menu[icon-label="Ordenar"] tp-yt-paper-button, yt-dropdown-menu[icon-label="Sort"] tp-yt-paper-button');
        if (!sortButton) {
            logActivity("Sort dropdown not found. Using current sort mode.");
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
            logActivity("Manual sort option not found. Using current sort mode.");
        }
    };
    
    await ensureManualSort();
    
    let reportedVideoCount = Number(document.querySelector(".metadata-stats span.yt-formatted-string:first-of-type").innerText);
    let allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
    let allAnchors;

    // Calculate adaptive delay
    if (useAdaptiveDelay) {
        if (autoScrollInitialVideoList) {
            // When loading all videos, use fastest possible speed with minimal delay
            scrollLoopTime = minDelay;
            logActivity(`Using fastest processing speed (${scrollLoopTime}ms)`);
        } else {
            // When not loading all videos, use calculated delay based on visible count
            let videoCount = reportedVideoCount || allDragPoints.length;
            let calculatedDelay = Math.max(minDelay, baseDelayPerVideo * videoCount);
            scrollLoopTime = Math.min(calculatedDelay, maxDelay);
            logActivity(`Using adaptive delay: ${scrollLoopTime}ms based on visible videos`);
        }
    }
    
    let sortedCount = 0;
    let initialVideoCount = allDragPoints.length;
    let scrollRetryCount = 0;
    stopSort = false;

    // Load all videos in playlist
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
        
        if (allDragPoints.length > 300) {
            logActivity(`${allDragPoints.length} videos loaded - this may take a while`);
        } else if (allDragPoints.length > 600) {
            logActivity(`${allDragPoints.length} videos - sorting large playlists may be slow`);
        }
        
        await autoScroll();

        allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        initialVideoCount = allDragPoints.length;

        if (((reportedVideoCount - initialVideoCount) / 10) < 1) {
            scrollRetryCount++;
        }
    }

    logActivity(initialVideoCount + " videos loaded.");
    if (scrollRetryCount > 5) logActivity(log.innerText + "\nScroll attempt exhausted. Proceeding with sort despite video count mismatch.");
    let loadedLocation = document.scrollingElement.scrollTop;
    scrollRetryCount = 0;

    // Sort and reorder videos
    const sortStartTime = Date.now();
    const maxSortTime = 300000; // 5 minutes maximum sort time
    
    while (sortedCount < initialVideoCount && stopSort === false) {
        // Check for timeout
        if (Date.now() - sortStartTime > maxSortTime) {
            logActivity("Sorting timed out after 5 minutes. Please try again with fewer videos.");
            return;
        }
        
        allDragPoints = document.querySelectorAll("ytd-item-section-renderer:first-of-type yt-icon#reorder");
        allAnchors = document.querySelectorAll("ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail");
        scrollRetryCount = 0;

        // Ensure video durations are loaded
        while (!allAnchors[initialVideoCount - 1].querySelector("#text") && stopSort === false) {
            if (document.scrollingElement.scrollTop < loadedLocation && scrollRetryCount < 3) {
                logActivity(`Loading video details... (${sortedCount + 1}/${initialVideoCount})`);
                await autoScroll(loadedLocation); // Fixed: use loadedLocation instead of currentLocation
                scrollRetryCount++;
            } else {
                logActivity(`Scrolling to load remaining content...`);
                await autoScroll();
            }
        }

        sortedCount = Number(sortVideos(allAnchors, allDragPoints, initialVideoCount) + 1);
        await waitForYoutubeProcessing();
    }
    
    // Show final status
    if (stopSort === true) {
        logActivity("Sorting canceled ⛔");
        stopSort = false;
    } else {
        logActivity(`Sorting complete ✓ (${sortedCount} videos organized)`);
    }
};

// Initialize UI components
let init = () => {
    onElementReady('div.thumbnail-and-metadata-wrapper', false, () => {
        autoScrollInitialVideoList = true;
        useAdaptiveDelay = true;
        
        renderContainerElement();
        addCssStyle();
        renderToggleButton();
        renderSelectElement(0, modeAvailable, 'Sort Order');
        renderLogElement();
        
        // Check page loading status
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
