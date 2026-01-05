let isEditingMode = false;

// listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleMode") {
        isEditingMode = !isEditingMode;
        if (!isEditingMode) removeAllHighlights();
        sendResponse({ isActive: isEditingMode });
    }
    // check if active
    if (request.action === "getStatus") {
        sendResponse({ isActive: isEditingMode });
    }
});

// esc key listener
document.addEventListener('keydown', function(e) {
    // if esc pressed and mode is on
    if (e.key === "Escape" && isEditingMode) {
        e.preventDefault(); 
        
        // stop editing if focused
        if (document.activeElement && document.activeElement.classList.contains('modo-edicion-activo')) {
            document.activeElement.blur(); // triggers save
        }

        // turn off everything
        isEditingMode = false;
        removeAllHighlights();
        console.log("editing mode stopped via esc");
    }
});

// hover logic
document.addEventListener('mouseover', function (e) {
    if (!isEditingMode) return;
    
    // don't highlight others if currently editing something
    if (document.activeElement && document.activeElement.contentEditable === "true") return;

    if (isValidTarget(e.target)) {
        e.target.classList.add('modo-edicion-hover');
    }
});

// remove hover effect
document.addEventListener('mouseout', function (e) {
    if (!isEditingMode) return;
    e.target.classList.remove('modo-edicion-hover');
});

// click to start editing
document.addEventListener('click', function (e) {
    if (!isEditingMode) return;
    
    if (isValidTarget(e.target)) {
        e.preventDefault(); 
        e.stopPropagation();

        const el = e.target;
        // remove hover style so it doesn't clash
        el.classList.remove('modo-edicion-hover'); 
        
        el.contentEditable = "true"; 
        el.classList.add('modo-edicion-activo');
        el.focus();

        // save on blur (click away)
        el.onblur = function () {
            el.contentEditable = "false";
            el.classList.remove('modo-edicion-activo');
            saveChange(el, el.innerText); 
        };
    }
}, true); 

// check if element is safe to edit
function isValidTarget(el) {
    // skip inputs, images, scripts, etc
    const tagsToIgnore = ['INPUT', 'TEXTAREA', 'IMG', 'SCRIPT', 'STYLE', 'HTML', 'BODY'];
    if (tagsToIgnore.includes(el.tagName)) return false;
    return true;
}

function removeAllHighlights() {
    document.querySelectorAll('.modo-edicion-hover').forEach(el => {
        el.classList.remove('modo-edicion-hover');
    });
}

// storage logic ---------------------------

// generate unique css selector for the element
function getUniqueSelector(el) {
    if (el.id) return '#' + el.id;
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break;
        } else {
            let sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector) nth++;
            }
            if (nth != 1) selector += ":nth-of-type(" + nth + ")";
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(" > ");
}

// save edits to local storage
function saveChange(element, text) {
    const selector = getUniqueSelector(element);
    const pageUrl = window.location.href;
    
    chrome.storage.local.get([pageUrl], (result) => {
        let edits = result[pageUrl] || [];
        const existingIndex = edits.findIndex(e => e.selector === selector);
        
        // update existing or add new
        if (existingIndex > -1) {
            edits[existingIndex].text = text;
        } else {
            edits.push({ selector: selector, text: text });
        }

        let saveObj = {};
        saveObj[pageUrl] = edits;
        chrome.storage.local.set(saveObj, () => console.log("saved to storage"));
    });
}

// restore saved text on load
function restoreEdits() {
    const pageUrl = window.location.href;
    chrome.storage.local.get([pageUrl], (result) => {
        const edits = result[pageUrl];
        if (edits) {
            edits.forEach(edit => {
                const element = document.querySelector(edit.selector);
                if (element) element.innerText = edit.text;
            });
        }
    });
}

// run restore
restoreEdits();
setTimeout(restoreEdits, 2000);