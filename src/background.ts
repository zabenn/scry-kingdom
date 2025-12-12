import browser from "webextension-polyfill";

browser.runtime.onMessage.addListener((message: any) => {
  if (message.action === "fetch") {
    return fetch(message.url, {
      headers: {
        "User-Agent": "ScryKingdom/1.0.0",
      },
    })
      .then((response) =>
        response.text().then((data) => ({ ok: response.ok, data: data }))
      )
      .catch((error) => ({ ok: false, error: error.message }));
  }
});
