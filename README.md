<p align="center">
  <img
    src="src/icons/icon.svg"
    alt="Scry Kingdom icon" height="200" width="200" />
</p>

# Scry Kingdom

A Firefox/Chrome extension that adds [Card Kingdom](https://www.cardkingdom.com) purchase buttons to [Scryfall](https://scryfall.com) card pages.

## Features

<table align="center">
  <tr>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="docs/stores_before.png" alt="Stores before" width="300" /></td>
    <td align="center">➡</td>
    <td><img src="docs/stores_after.png" alt="Stores after" width="300" /></td>
  </tr>
  <tr>
    <td><img src="docs/prints_before.png" alt="Prints before" width="300" /></td>
    <td align="center">➡</td>
    <td><img src="docs/prints_after.png" alt="Prints after" width="300" /></td>
  </tr>
</table>

- Shows Card Kingdom prices for both regular and foil versions.
- Shows prices inline in the prints section.

## Limitations

- Finds a direct link around 90% of the time.
- If the direct link cannot be found, links to a search on Card Kingdom.
- The incomplete list of conversions from set codes to Card Kingdom URL slugs is the main source of missing links.
