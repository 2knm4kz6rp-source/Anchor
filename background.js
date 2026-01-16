chrome.action.onClicked.addListener(async (tab) => {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    });

    const text = result.result || "";
    const encoded = encodeURIComponent(text);

    const url = "https://2knm4kz6rp-source.github.io/Anchor/#" + encoded;

    chrome.tabs.create({ url });
  } catch (e) {
    console.error("Anchor extension error:", e);
  }
});
