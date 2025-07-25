let pageUrl = "";

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
        // console.log(encodeURIComponent(title));
        const response = await fetch(`http://localhost:8000/predict`, {
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
        // console.log(title);

        let result = await predictClickbait(title);

        if (result) {
            // console.log('Prediction result:', result);
            result = (result.combined_probability * 100).toFixed(2);
            titleElement.textContent = title + ' ' + result + '%';
            if (titleElement.hasAttribute('is-empty')) {
                titleElement.removeAttribute('is-empty');
            }
        }
        
    } else {
        setTimeout(waitForVideoTitleUpdate, 2000);
    }
}

if (window.location.href.includes('/watch?v=')) {
    if (pageUrl !== window.location.href) {
        pageUrl = window.location.href;
        console.log(window.location.href);
        setTimeout(waitForVideoTitleUpdate, 3000);
    }
}

function onPageMutation() {
    if (pageUrl !== window.location.href) {
        pageUrl = window.location.href;
        console.log(window.location.href);
        setTimeout(waitForVideoTitleUpdate, 3000);
    }
}

const observer = new MutationObserver((mutations) => {
    onPageMutation();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
});