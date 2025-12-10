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

function getCardKingdomUrl(card: Card): string {
  let setSlug = setCodeToSlug[card.set];
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
    return cardKingdomDocument.querySelector(".stylePrice")?.innerHTML ?? null;
  }
  return null;
}

async function main() {
  const storesElement = document.getElementById("stores");

  const ul = storesElement!.children[1];

  const li = document.createElement("li");

  let card: Card | null = null;

  let nonFoilUrl: string = "";
  let nonFoilPrice: string | null = null;

  let foilUrl: string = "";
  let foilPrice: string | null = null;

  try {
    card = await Cards.bySet(
      document.URL.split("/")[4],
      document.URL.split("/")[5]
    );

    if (card.finishes.includes("nonfoil")) {
      nonFoilUrl = getCardKingdomUrl(card);
      nonFoilPrice = await fetchCardKingdomPrice(nonFoilUrl);

      const nonFoilLink = document.createElement("a");
      nonFoilLink.className = "button-n";

      nonFoilLink.appendChild(createCardKingdomSvg());

      const nonFoilLabel = document.createElement("i");
      nonFoilLabel.innerHTML = "Buy on Card Kingdom";

      if (nonFoilPrice) {
        nonFoilLink.href = nonFoilUrl;

        const nonFoilSpan = document.createElement("span");
        nonFoilSpan.className = "price currency-eur";
        nonFoilSpan.innerHTML = nonFoilPrice;

        nonFoilLink.appendChild(nonFoilLabel);
        nonFoilLink.appendChild(nonFoilSpan);
      } else {
        nonFoilLink.href = `https://www.cardkingdom.com/catalog/search?&filter[tab]=mtg_card&filter[search]=mtg_advanced&filter[name]=${!card.card_faces ? card.name : card.card_faces[0].name}`;

        nonFoilLink.appendChild(nonFoilLabel);
      }

      li.appendChild(nonFoilLink);
    }

    if (card.finishes.includes("foil")) {
      foilUrl = `${getCardKingdomUrl(card)}-foil`;
      foilPrice = await fetchCardKingdomPrice(foilUrl);

      const foilLink = document.createElement("a");
      foilLink.className = "button-n";

      foilLink.appendChild(createCardKingdomSvg());

      const foilLabel = document.createElement("i");
      foilLabel.innerHTML = "Buy foil on Card Kingdom";

      if (foilPrice) {
        foilLink.href = foilUrl;

        const foilSpan = document.createElement("span");
        foilSpan.className = "price currency-eur";
        foilSpan.innerHTML = `✶ ${foilPrice}`;

        foilLink.appendChild(foilLabel);
        foilLink.appendChild(foilSpan);
      } else {
        foilLink.href = `https://www.cardkingdom.com/catalog/search?filter[tab]=mtg_foil&filter[search]=mtg_advanced&filter[name]=${!card.card_faces ? card.name : card.card_faces[0].name}`;

        foilLink.appendChild(foilLabel);
      }

      li.appendChild(foilLink);
    }
  } catch (e) {
    console.error(
      "Error fetching card from Scryfall: ",
      document.URL.split("/")[4],
      document.URL.split("/")[5]
    );
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
    if (row.children[1]) {
      row.children[1].insertAdjacentElement(
        "afterend",
        document.createElement("td")
      );
    }
  }

  for (const row of printsBody.children) {
    const scryfallLink = row.children[0].children[0] as HTMLAnchorElement;

    if (row.classList.contains("current")) {
      if (nonFoilPrice) {
        const rowLink = document.createElement("a");
        rowLink.className = "currency-eur";
        rowLink.href = nonFoilUrl;
        rowLink.innerHTML = nonFoilPrice;

        row.children[2].appendChild(rowLink);
      } else if (foilPrice) {
        const rowLink = document.createElement("a");
        rowLink.className = "currency-eur";
        rowLink.href = foilUrl;
        rowLink.innerHTML = foilPrice;

        row.children[2].appendChild(rowLink);
      }
      continue;
    }

    await setTimeout(() => {}, 500);

    try {
      const card = await Cards.bySet(
        scryfallLink.href.split("/")[4],
        scryfallLink.href.split("/")[5]
      );

      const rowUrl = getCardKingdomUrl(card);

      fetchCardKingdomPrice(rowUrl).then((rowPrice) => {
        if (rowPrice) {
          const rowLink = document.createElement("a");
          rowLink.className = "currency-eur";
          rowLink.href = rowUrl;
          rowLink.innerHTML = rowPrice;

          row.children[2].appendChild(rowLink);
        }
      });
    } catch (e) {
      console.error(
        "Error fetching card from Scryfall: ",
        scryfallLink.href.split("/")[4],
        scryfallLink.href.split("/")[5]
      );
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
