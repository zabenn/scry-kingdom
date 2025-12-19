import { Card, CardIdentifier, Cards, setAgent } from "scryfall-sdk";
import setCodeToSlugs from "./setCodeToSlugs";
import browElementser from "webextension-polyfill";

type CardKingdomEntry = Partial<
  Record<
    "foil" | "glossy" | "nonfoil" | "etched",
    {
      price: string | null;
      url: string;
    }
  >
>;

interface CardKingdomCatalog {
  [setSlug: string]: {
    [collectorNumber: string]: CardKingdomEntry;
  };
}

function getSetSlugs(scryfallCard: Card): string[] {
  const setSlugs: string[] = [];
  if (scryfallCard.promo_types?.includes("promopack")) {
    setSlugs.push("promo-pack");
  }
  const setCodeSlugs = setCodeToSlugs[scryfallCard.set];
  if (setCodeSlugs) {
    for (const setCodeSlug of setCodeSlugs) {
      setSlugs.push(setCodeSlug);
      if (scryfallCard.promo_types?.includes("boxtopper")) {
        setSlugs.push(setCodeSlug.concat("-box-toppers"));
      }
      if (
        scryfallCard.frame_effects?.length !== 0 ||
        scryfallCard.promo_types?.length !== 0
      ) {
        setSlugs.push(setCodeSlug.concat("-variants"));
      }
      setSlugs.push(setCodeSlug.concat("-jpn"));
    }
  }
  setSlugs.push("promotional");
  return setSlugs;
}

function getCollectorNumbers(scryfallCard: Card): string[] {
  return [
    ...new Set([
      scryfallCard.collector_number,
      ...(scryfallCard.collector_number.match(/\d+/g) ?? []),
    ]),
  ];
}

function getCardKingdomEntry(
  cardKingdomCatalog: CardKingdomCatalog,
  scryfallCard: Card
): CardKingdomEntry | null {
  if (!scryfallCard.games?.includes("paper")) {
    console.log(
      "Card is not available in paper: ",
      scryfallCard.set,
      scryfallCard.collector_number
    );
    return null;
  }
  if (scryfallCard.promo_types?.includes("serialized")) {
    console.log(
      "Card is serialized: ",
      scryfallCard.set,
      scryfallCard.collector_number
    );
    return null;
  }

  const setSlugs = getSetSlugs(scryfallCard);
  const collectorNumbers = getCollectorNumbers(scryfallCard);
  let entry: CardKingdomEntry | undefined;
  for (const setSlug of setSlugs) {
    for (const collectorNumber of collectorNumbers) {
      entry = cardKingdomCatalog[setSlug]?.[collectorNumber];
      if (entry) {
        break;
      }
    }
    if (entry) {
      break;
    }
  }

  if (!entry) {
    console.warn(
      "Error finding card in catalog: ",
      setSlugs,
      collectorNumbers,
      cardKingdomCatalog
    );
    return null;
  }

  return entry;
}

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
  path.setAttribute("fill", "#004285");
  path.setAttribute(
    "d",
    "m0 293.82v1.1592h0.52042v2.0158h2.6633v-2.0158h0.52042v-1.1592h-0.57636v1.0908h-0.49196v-1.084h-0.54839v1.084h-0.47074v-1.084h-0.54839v1.084h-0.49196v-1.0908z"
  );

  g.appendChild(path);
  svg.appendChild(g);
  return svg;
}

async function main() {
  setAgent("ScryKingdom", "1.0.1");

  const cardKingdomCatalog: CardKingdomCatalog = {};

  const storesElement = document.getElementById("stores")!.children[1];
  const printsElement = document.querySelector(".prints")!;
  const tableElement = Array.from(
    printsElement.querySelectorAll("table.prints-table")
  ).find((table) => table.innerHTML.includes("Prints"))!;
  const headElement = tableElement.querySelector("thead")!;
  const bodyElement = tableElement.querySelector("tbody")!;

  const scryfallLinks = new Set<string>();
  for (const rowElement of bodyElement.children) {
    if (rowElement.innerHTML.includes("View all prints")) {
      continue;
    }
    const scryfallLinkElement = rowElement.children[0]
      .children[0] as HTMLAnchorElement;
    scryfallLinks.add(scryfallLinkElement.href);
  }

  const cardCollection = await Cards.collection(
    ...Array.from(scryfallLinks).map((scryfallLink) => {
      return CardIdentifier.bySet(
        scryfallLink.split("/")[4],
        decodeURIComponent(scryfallLink.split("/")[5])
      );
    })
  ).waitForAll();

  const scryfallCards: Record<string, Card> = {};
  for (let i = 0; i < cardCollection.length; i++) {
    scryfallCards[Array.from(scryfallLinks)[i]] = cardCollection[i];
  }

  const scryfallCard = scryfallCards[document.URL.split("?")[0]];
  let cardName = scryfallCard!.name;
  if (scryfallCard!.card_faces && scryfallCard!.layout !== "split") {
    cardName = scryfallCard!.card_faces[0].name;
  }

  const urls = new Set<string>();
  if (["Forest", "Island", "Mountain", "Plains", "Swamp"].includes(cardName)) {
    const allSetSlugs = new Set<string>();
    for (const scryfallCard of Object.values(scryfallCards)) {
      for (const setSlug of getSetSlugs(scryfallCard)) {
        allSetSlugs.add(setSlug);
      }
    }
    for (const setSlug of allSetSlugs) {
      for (const searchTab of ["mtg_card", "mtg_foil"]) {
        urls.add(
          `https://www.cardkingdom.com/catalog/search?=mtg_advanced&filter[edition]=${setSlug}&filter[tab]=${searchTab}&filter[search]=mtg_advanced&filter[name]=${cardName}`
        );
      }
    }
  } else if (["Command Tower", "Sol Ring"].includes(cardName)) {
    for (let i = 1; i <= 2; i++) {
      for (const searchTab of ["mtg_card", "mtg_foil"]) {
        urls.add(
          `https://www.cardkingdom.com/catalog/search?filter[tab]=${searchTab}&filter[search]=mtg_advanced&filter[name]=${cardName}&page=${i}`
        );
      }
    }
  } else {
    for (const searchTab of ["mtg_card", "mtg_foil"]) {
      urls.add(
        `https://www.cardkingdom.com/catalog/search?filter[tab]=${searchTab}&filter[search]=mtg_advanced&filter[name]=${cardName}`
      );
    }
  }

  for (const url of urls) {
    console.log("Fetching Card Kingdom URL: ", url);
    const response: any = await browElementser.runtime.sendMessage({
      action: "fetch",
      url: url,
    });
    if (response.ok) {
      const parser = new DOMParser();
      const cardKingdomDocument = parser.parseFromString(
        response.data!,
        "text/html"
      );

      cardKingdomDocument
        .querySelectorAll(".productCardWrapper")
        .forEach((productCardWrapperElement) => {
          const price = productCardWrapperElement
            .querySelector(".addToCartByType")
            ?.querySelector(".active")
            ?.querySelector(".stylePrice")?.innerHTML as string;
          const url = (
            productCardWrapperElement.querySelector(".productDetailTitle")
              ?.children[0] as HTMLAnchorElement
          ).href.replace("scryfall", "cardkingdom");

          const setSlug = url.split("/")[4];
          const collectorNumber = productCardWrapperElement
            .querySelector(".collector-number")
            ?.innerHTML.trim()
            .replace("Collector #: ", "")
            .replace(/^0+/, "");

          let finish: "foil" | "glossy" | "nonfoil" | "etched" = "nonfoil";
          if (url.includes("etched-foil")) {
            finish = "etched";
          } else if (url.includes("foil")) {
            finish = "foil";
          }

          cardKingdomCatalog[setSlug] ??= {};
          cardKingdomCatalog[setSlug][collectorNumber!] ??= {};
          cardKingdomCatalog[setSlug][collectorNumber!][finish] = {
            price: price,
            url: url,
          };
        });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }

  const listElement = document.createElement("li");

  const cardKingdomEntries: Record<string, CardKingdomEntry> = {};
  for (const scryfallLink of scryfallLinks) {
    const card = scryfallCards[scryfallLink];
    cardKingdomEntries[scryfallLink] =
      (card && getCardKingdomEntry(cardKingdomCatalog, card)) ?? {};
  }

  const currentCardEntry =
    cardKingdomEntries[document.URL.split("?")[0]] ?? ({} as CardKingdomEntry);
  const currentCardEntries = (["nonfoil", "foil", "etched", "glossy"] as const)
    .filter((finish) => finish in currentCardEntry)
    .map((finish) => [finish, currentCardEntry[finish]] as const);

  if (currentCardEntries.length === 0) {
    const linkElement = document.createElement("a");
    linkElement.className = "button-n card-kingdom";
    linkElement.href = `https://www.cardkingdom.com/catalog/search?filter[search]=mtg_advanced&filter[name]=${encodeURIComponent(cardName)}`;

    linkElement.appendChild(createCardKingdomSvg());

    const labelElement = document.createElement("i");
    labelElement.innerHTML = "Buy on Card Kingdom";
    linkElement.appendChild(labelElement);

    listElement.appendChild(linkElement);
  } else {
    for (const [finish, entry] of currentCardEntries) {
      const price = entry?.price ?? null;
      const url = entry?.url ?? "";

      const linkElement = document.createElement("a");
      linkElement.className = "button-n card-kingdom";
      linkElement.href = url;

      linkElement.appendChild(createCardKingdomSvg());

      const labelElement = document.createElement("i");
      if (finish === "nonfoil") {
        labelElement.innerHTML = "Buy on Card Kingdom";
      } else {
        labelElement.innerHTML = `Buy ${finish} on Card Kingdom`;
      }
      linkElement.appendChild(labelElement);

      if (price) {
        const spanElement = document.createElement("span");
        spanElement.className = "price cardkingdom";
        if (finish === "nonfoil") {
          spanElement.innerHTML = price;
        } else {
          spanElement.innerHTML = `✶ ${price}`;
        }
        linkElement.appendChild(spanElement);
      }

      listElement.appendChild(linkElement);
    }
  }

  storesElement.insertBefore(listElement, storesElement.children[1]);

  const ckdCellElement = document.createElement("th");
  ckdCellElement.innerHTML = "<span>CKD</span>";

  const tcgCellElement = headElement.children[0].children[1];
  tcgCellElement.innerHTML = "<span>TCG</span>";
  tcgCellElement.insertAdjacentElement("afterend", ckdCellElement);

  for (const rowElement of bodyElement.children) {
    if (rowElement.innerHTML.includes("View all prints")) {
      (rowElement.children[0] as HTMLTableCellElement).colSpan = 5;
      continue;
    }

    rowElement.children[1].insertAdjacentElement(
      "afterend",
      document.createElement("td")
    );

    const scryfallLinkElement = rowElement.children[0]
      .children[0] as HTMLAnchorElement;
    const entry = cardKingdomEntries[scryfallLinkElement.href];
    const { url, price } = entry?.nonfoil ?? entry?.foil ?? entry?.etched ?? {};
    if (url) {
      const rowElementLink = document.createElement("a");
      rowElementLink.className = "card-kingdom";
      rowElementLink.href = url;
      rowElementLink.innerHTML = price ?? "";
      rowElement.children[2].appendChild(rowElementLink);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
