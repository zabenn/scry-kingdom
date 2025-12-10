import { Card, Cards } from "scryfall-sdk";
import setCodeToSlug from "./setCodeToSlug";
import browser from "webextension-polyfill";

function createCardKingdomSvg(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("height", "14");
  svg.setAttribute("width", "14");
  svg.setAttribute("viewBox", "0 0 3.7041667 3.1750001");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", "translate(0 -293.82)");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "m0 293.82v1.1592h0.52042v2.0158h2.6633v-2.0158h0.52042v-1.1592h-0.57636v1.0908h-0.49196v-1.084h-0.54839v1.084h-0.47074v-1.084h-0.54839v1.084h-0.49196v-1.0908z"
  );

  g.appendChild(path);
  svg.appendChild(g);
  return svg;
}

async function getScryfallCard(url: string): Promise<Card | null> {
  const setCode = url.split("/")[4].trim();
  const collectorNumber = url.split("/")[5].trim();
  try {
    return await Cards.bySet(setCode, collectorNumber);
  } catch (e) {
    console.error(
      "Error fetching card from Scryfall API: ",
      setCode,
      collectorNumber
    );
    return null;
  }
}

function getCardKingdomUrl(card: Card): string | null {
  let setSlug = setCodeToSlug[card.set];
  if (!setSlug) {
    console.error("Error converting set slug: ", card.set);
    return null;
  }
  if (card.promo_types?.includes("promopack")) {
    setSlug = "promo-pack";
  } else if (card.promo_types?.includes("boosterfun")) {
    setSlug = setSlug.concat("-variants");
  }

  let nameSlug = card.name;
  if (card.card_faces) {
    nameSlug = card.card_faces[0].name;
  }
  nameSlug = nameSlug.toLowerCase().replace(/ /g, "-").replace(/[,']/g, "");

  return `https://www.cardkingdom.com/mtg/${setSlug}/${nameSlug}`;
}

async function fetchCardKingdomPrice(url: string): Promise<string | null> {
  const response: any = await browser.runtime.sendMessage({
    action: "fetch",
    url: url,
  });
  if (response.ok) {
    const parser = new DOMParser();
    const cardKingdomDocument = parser.parseFromString(
      response.data!,
      "text/html"
    );
    const price = cardKingdomDocument.querySelector(".stylePrice")?.innerHTML;
    if (!price) {
      console.error("Error fetching Price from Card Kingdom page: ", url);
    }
    return cardKingdomDocument.querySelector(".stylePrice")?.innerHTML ?? null;
  } else {
    console.error("Error fetching card from Card Kingdom page: ", url);
    return null;
  }
}

async function main() {
  const storesElement = document.getElementById("stores");

  const ul = storesElement!.children[1];

  const li = document.createElement("li");

  const card = await getScryfallCard(document.URL);

  const finishToUrl: Record<string, string> = {};
  const finishToPrice: Record<string, string> = {};

  if (card) {
    for (const finish of card.finishes) {
      let url = await getCardKingdomUrl(card);
      let price;
      if (url) {
        if (finish === "foil") {
          url = url.concat("-foil");
        } else if (finish === "etched") {
          url = url.concat("-etched-foil");
        }
        price = await fetchCardKingdomPrice(url);
      }

      if (!url || !price) {
        let searchTab = "mtg_card";
        if (finish !== "nonfoil") {
          searchTab = "mtg_foil";
        }
        let cardName = card.name;
        if (card.card_faces) {
          cardName = card.card_faces[0].name;
        }
        url = `https://www.cardkingdom.com/catalog/search?filter[tab]=${searchTab}&filter[search]=mtg_advanced&filter[name]=${cardName}`;
      }

      const link = document.createElement("a");
      link.className = "button-n";
      link.href = url;

      link.appendChild(createCardKingdomSvg());

      const label = document.createElement("i");
      if (finish === "nonfoil") {
        label.innerHTML = "Buy on Card Kingdom";
      } else {
        label.innerHTML = `Buy ${finish} on Card Kingdom`;
      }
      link.appendChild(label);

      if (price) {
        const span = document.createElement("span");
        span.className = "price currency-eur";
        if (finish === "nonfoil") {
          span.innerHTML = price;
        } else {
          span.innerHTML = `✶ ${price}`;
        }
        link.appendChild(span);
      }

      li.appendChild(link);

      finishToUrl[finish] = url;
      if (price) {
        finishToPrice[finish] = price;
      }
    }
  }

  ul.insertBefore(li, ul.children[1]);

  const printsElement = document.querySelector(".prints")!;
  const printsTable = Array.from(
    printsElement.querySelectorAll("table.prints-table")
  ).find((table) => table.innerHTML.includes("Prints"))!;
  const printsHead = printsTable.querySelector("thead")!;
  const printsBody = printsTable.querySelector("tbody")!;

  const ckdTh = document.createElement("th");
  ckdTh.innerHTML = "<span>CKD</span>";

  const tcgTh = printsHead.children[0].children[1];
  tcgTh.innerHTML = "<span>TCG</span>";
  tcgTh.insertAdjacentElement("afterend", ckdTh);

  for (const row of printsBody.children) {
    if (row.innerHTML.includes("View all prints")) {
      (row.children[0] as HTMLTableCellElement).colSpan = 5;
    } else {
      row.children[1].insertAdjacentElement(
        "afterend",
        document.createElement("td")
      );
    }
  }

  for (const row of printsBody.children) {
    if (row.innerHTML.includes("View all prints")) {
      continue;
    }

    const scryfallLink = row.children[0].children[0] as HTMLAnchorElement;

    if (row.classList.contains("current")) {
      if (Object.keys(finishToPrice).length > 0) {
        const key = Object.keys(finishToPrice)[0];
        const rowLink = document.createElement("a");
        rowLink.className = "currency-eur";
        rowLink.href = finishToUrl[key];
        rowLink.innerHTML = finishToPrice[key];
        row.children[2].appendChild(rowLink);
      }
      continue;
    }

    await setTimeout(() => {}, 500);

    const card = await getScryfallCard(scryfallLink.href);

    if (card) {
      const url = getCardKingdomUrl(card);
      if (!url) {
        return;
      }
      fetchCardKingdomPrice(url).then((rowPrice) => {
        if (rowPrice) {
          const rowLink = document.createElement("a");
          rowLink.className = "currency-eur";
          rowLink.href = url;
          rowLink.innerHTML = rowPrice;
          row.children[2].appendChild(rowLink);
        }
      });
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
