let pageUrl = "";
const PREDICTION_BADGE_CLASS = 'clickbait-prediction-badge';
const API_URL = 'http://localhost:8000';

// Cross-browser compatible runtime API
const runtime = typeof chrome !== 'undefined' ? chrome.runtime : (typeof browser !== 'undefined' ? browser.runtime : null);

function getVideoTitleElement() {
    const selectors = [
        'h1.ytd-watch-metadata yt-formatted-string',
        'h1.ytd-video-primary-info-renderer',
        '#title h1',
        '.ytd-watch-metadata h1',
        'h1[class*="title"]'
    ];
    
    for (const selector of selectors) {
        const titleElement = document.querySelector(selector);

        if (titleElement) {
            return titleElement;
        }
    }
    
    return null;
}

async function predictClickbait(title) {
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "title": title })
        });
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Error connecting to prediction API:', error);
        return null;
    }
}

async function waitForVideoTitleUpdate() {
    const titleElement = getVideoTitleElement();
    const title = titleElement ? titleElement.getAttribute('title') : null;
    console.log('Current title:', title);

    if (title) {
        console.log(title);

        let result = await predictClickbait(title);

        if (result) {
            console.log('Prediction result:', titleElement);
            result = (result.combined_probability * 100).toFixed(2);
            titleElement.textContent = title + ' ' + result + '%';
            const prob = parseFloat(result);
            titleElement.style.fontWeight = 'bold';
            if (!isNaN(prob)) {
                // map prob (0-100) to hue 120 (green) -> 0 (red)
                const clamped = Math.max(0, Math.min(100, prob));
                const hue = (1 - clamped / 100) * 120;
                titleElement.style.transition = 'color 2s ease';
                titleElement.style.color = `hsl(${hue}, 85%, 40%)`;
            }
            if (titleElement.hasAttribute('is-empty')) {
                titleElement.removeAttribute('is-empty');
            }
        }
        
    } else {
        setTimeout(waitForVideoTitleUpdate, 1000);
    }
}

if (window.location.href.includes('/watch?v=')) {
    if (pageUrl !== window.location.href) {
        pageUrl = window.location.href;
        console.log(window.location.href);
        setTimeout(waitForVideoTitleUpdate, 1000);
    }
}

function onPageMutation() {
    if (pageUrl !== window.location.href) {
        pageUrl = window.location.href;
        console.log(window.location.href);
        setTimeout(waitForVideoTitleUpdate, 1000);
    }
}

const observer = new MutationObserver(() => {
    onPageMutation();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
});