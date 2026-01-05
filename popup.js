// check status when popup opens
window.onload = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "getStatus" }, (response) => {
        if (!chrome.runtime.lastError && response) {
            updateUI(response.isActive);
        }
    });
};

// handle button click
document.getElementById('toggleBtn').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // send toggle message to content script
    chrome.tabs.sendMessage(tab.id, { action: "toggleMode" }, (response) => {
        if(chrome.runtime.lastError) {
           // if error, page probably hasn't loaded script yet
           document.getElementById('status').innerText = "reload page first.";
        } else {
           updateUI(response.isActive);
        }
    });
});

function updateUI(isActive) {
    const btn = document.getElementById('toggleBtn');
    const status = document.getElementById('status');
    
    if (isActive) {
        btn.innerText = "disable editing";
        btn.classList.add('active');
        status.innerText = "status: editing on (press esc to quit)";
    } else {
        btn.innerText = "enable editing";
        btn.classList.remove('active');
        status.innerText = "status: off";
    }
}