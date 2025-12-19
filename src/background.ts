import browser from "webextension-polyfill";

browser.runtime.onMessage.addListener((message: any) => {
  console.log("hi");
  if (message.action === "fetch") {
    return fetch(message.url, {
      headers: {
        "User-Agent": "ScryKingdom/1.0.1",
      },
    })
      .then((response) =>
        response.text().then((data) => ({ ok: response.ok, data: data }))
      )
      .catch((error) => ({ ok: false, error: error.message }));
  }
});
