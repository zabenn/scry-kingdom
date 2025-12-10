import { Cards } from "scryfall-sdk";

async function addButton() {
  const storesElement = document.getElementById("stores");
  if (storesElement) {
    document.URL;
    const ul = storesElement.children[1];

    const card = await Cards.bySet(
      document.URL.split("/")[4],
      document.URL.split("/")[5]
    );

    let urlSetName = card.set_name.replace(/ /g, "-").toLowerCase();
    if (urlSetName.includes("commander")) {
      urlSetName = urlSetName.concat("-decks");
    }
    if (card.promo_types?.includes("boosterfun")) {
      urlSetName = urlSetName.concat("-variants");
    }
    console.log(card.frame_effects);

    const urlCardName = card.name
      .replace(/ /g, "-")
      .replace(/,/g, "")
      .toLowerCase();

    const li = document.createElement("li");

    if (card.finishes.includes("nonfoil")) {
      const nonFoilLink = document.createElement("a");
      nonFoilLink.className = "button-n";
      nonFoilLink.href = `https://www.cardkingdom.com/mtg/${urlSetName}/${urlCardName}`;

      const nonFoilLabel = document.createElement("i");
      nonFoilLabel.textContent = "Buy on Card Kingdom";

      const nonFoilPrice = document.createElement("span");
      nonFoilPrice.className = "price currency-eur";
      //   nonFoilPrice.textContent = "$0.14";

      nonFoilLink.appendChild(nonFoilLabel);
      nonFoilLink.appendChild(nonFoilPrice);

      li.appendChild(nonFoilLink);
    }

    if (card.finishes.includes("foil")) {
      const foilLink = document.createElement("a");
      foilLink.className = "button-n";
      foilLink.href = `https://www.cardkingdom.com/mtg/${urlSetName}/${urlCardName}-foil`;

      const foilLabel = document.createElement("i");
      foilLabel.textContent = "Buy foil on Card Kingdom";

      const foilPrice = document.createElement("span");
      foilPrice.className = "price currency-eur";
      //   foilPrice.innerHTML = "✶&nbsp;$0.20";

      foilLink.appendChild(foilLabel);
      foilLink.appendChild(foilPrice);

      li.appendChild(foilLink);

      ul.insertBefore(li, ul.children[1]);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addButton);
} else {
  addButton();
}
