// creates menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "editar-texto",
    title: "edit and save text",
    contexts: ["selection"]
  });
});

// Escucha el clic en el menú
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "editar-texto") {
    // Envía un mensaje al script de contenido (la página actual)
    chrome.tabs.sendMessage(tab.id, { action: "editar" });
  }
});