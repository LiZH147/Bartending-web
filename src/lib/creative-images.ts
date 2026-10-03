import type { HydratedIngredient } from "./data";

/**
 * Deterministic, keyless real-photo mapping for AI-created cocktails.
 *
 * AI recipes have no canonical photograph, so we show a real cocktail photo
 * that matches the drink's base spirit/family (photography from the same
 * public TheCocktailDB CDN used for the classic recipes). Each family maps to
 * several photos and the choice is hashed from the cocktail name, so different
 * AI creations with the same base spirit get different images — instantly and
 * with no API call. When AI image generation is enabled (see ai.ts), the detail
 * page can later upgrade a single drink to a unique generated photo.
 */

export const SPIRIT_IMAGE_POOLS: Record<string, string[]> = {
  // spirits
  gin: [
    "https://www.thecocktaildb.com/images/media/drink/drtihp1606768397.jpg", // gin fizz
    "https://www.thecocktaildb.com/images/media/drink/3xgldt1513707271.jpg", // gimlet
    "https://www.thecocktaildb.com/images/media/drink/k0508k1668422436.jpg", // gin & tonic
    "https://www.thecocktaildb.com/images/media/drink/7cll921606854636.jpg", // tom collins
    "https://www.thecocktaildb.com/images/media/drink/hrxfbl1606773109.jpg", // french 75
  ],
  vodka: [
    "https://www.thecocktaildb.com/images/media/drink/kpsajh1504368362.jpg", // cosmopolitan
    "https://www.thecocktaildb.com/images/media/drink/qyxrqw1439906528.jpg", // vodka martini
    "https://www.thecocktaildb.com/images/media/drink/3pylqc1504370988.jpg", // moscow mule
    "https://www.thecocktaildb.com/images/media/drink/n0sx531504372951.jpg", // espresso martini
    "https://www.thecocktaildb.com/images/media/drink/vsrupw1472405732.jpg", // white russian
  ],
  white_rum: [
    "https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg", // daiquiri
    "https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg", // mojito
    "https://www.thecocktaildb.com/images/media/drink/upgsue1668419912.jpg", // pina colada
  ],
  dark_rum: [
    "https://www.thecocktaildb.com/images/media/drink/t1tn0s1504374905.jpg", // dark & stormy
    "https://www.thecocktaildb.com/images/media/drink/wmkbfj1606853905.jpg", // cuba libre
    "https://www.thecocktaildb.com/images/media/drink/twyrrp1439907470.jpg", // mai tai
  ],
  cachaca: [
    "https://www.thecocktaildb.com/images/media/drink/jgvn7p1582484435.jpg", // caipirinha
    "https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg", // daiquiri
  ],
  tequila: [
    "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg", // margarita
    "https://www.thecocktaildb.com/images/media/drink/samm5j1513706393.jpg", // paloma
    "https://www.thecocktaildb.com/images/media/drink/quqyqp1480879103.jpg", // tequila sunrise
  ],
  mezcal: [
    "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg", // margarita
    "https://www.thecocktaildb.com/images/media/drink/91oule1513702624.jpg", // last word (smoky/herbal)
  ],
  bourbon: [
    "https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg", // old fashioned
    "https://www.thecocktaildb.com/images/media/drink/hbkfsh1589574990.jpg", // whiskey sour
    "https://www.thecocktaildb.com/images/media/drink/km84qi1513705868.jpg", // boulevardier
  ],
  rye_whiskey: [
    "https://www.thecocktaildb.com/images/media/drink/yk70e31606771240.jpg", // manhattan
    "https://www.thecocktaildb.com/images/media/drink/vvpxwy1439907208.jpg", // sazerac
  ],
  scotch: [
    "https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg", // old fashioned
    "https://www.thecocktaildb.com/images/media/drink/yk70e31606771240.jpg", // manhattan
  ],
  brandy: [
    "https://www.thecocktaildb.com/images/media/drink/x72sik1606854964.jpg", // sidecar
    "https://www.thecocktaildb.com/images/media/drink/mlyk1i1606772340.jpg", // brandy alexander
  ],
  cognac: [
    "https://www.thecocktaildb.com/images/media/drink/x72sik1606854964.jpg", // sidecar
    "https://www.thecocktaildb.com/images/media/drink/twyrrp1439907470.jpg", // mai tai (fruity)
  ],
  pisco: [
    "https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg", // daiquiri (citrus sour)
    "https://www.thecocktaildb.com/images/media/drink/x72sik1606854964.jpg", // sidecar
  ],
  absinthe: [
    "https://www.thecocktaildb.com/images/media/drink/91oule1513702624.jpg", // last word (green/herbal)
    "https://www.thecocktaildb.com/images/media/drink/vvpxwy1439907208.jpg", // sazerac
  ],
  aquavit: [
    "https://www.thecocktaildb.com/images/media/drink/6ck9yi1589574317.jpg", // dry martini (clear)
    "https://www.thecocktaildb.com/images/media/drink/drtihp1606768397.jpg", // gin fizz
  ],
  // liqueur-led / aperitifs
  campari: [
    "https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg", // negroni
    "https://www.thecocktaildb.com/images/media/drink/km84qi1513705868.jpg", // boulevardier
  ],
  sweet_vermouth: [
    "https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg", // negroni
    "https://www.thecocktaildb.com/images/media/drink/yk70e31606771240.jpg", // manhattan
  ],
  dry_vermouth: [
    "https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg", // negroni
    "https://www.thecocktaildb.com/images/media/drink/qyxrqw1439906528.jpg", // vodka martini
  ],
  aperol: [
    "https://www.thecocktaildb.com/images/media/drink/iloasq1587661955.jpg", // aperol spritz
    "https://www.thecocktaildb.com/images/media/drink/709s6m1613655124.jpg", // americano
  ],
  champagne: [
    "https://www.thecocktaildb.com/images/media/drink/hrxfbl1606773109.jpg", // french 75
    "https://www.thecocktaildb.com/images/media/drink/juhcuu1504370685.jpg", // mimosa
  ],
  prosecco: [
    "https://www.thecocktaildb.com/images/media/drink/iloasq1587661955.jpg", // aperol spritz
    "https://www.thecocktaildb.com/images/media/drink/juhcuu1504370685.jpg", // mimosa
  ],
};

const DEFAULT_IMAGES = [
  "https://www.thecocktaildb.com/images/media/drink/kpsajh1504368362.jpg", // cosmopolitan
  "https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg", // daiquiri
  "https://www.thecocktaildb.com/images/media/drink/x72sik1606854964.jpg", // sidecar
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickFrom(pool: string[], seed: string): string {
  return pool[hashString(seed) % pool.length];
}

/** Pick a real, varied photo for an AI-created spec based on its base spirit/family. */
export function creativeImageUrl(
  ingredientIds: string[],
  allIngredients: HydratedIngredient[],
  seed = "",
): string {
  const byId = new Map(allIngredients.map((i) => [i.id, i]));
  const present = ingredientIds.map((id) => byId.get(id)).filter((i): i is HydratedIngredient => Boolean(i));

  const spirit = present.find((i) => i.category === "spirit");
  if (spirit && SPIRIT_IMAGE_POOLS[spirit.id]) return pickFrom(SPIRIT_IMAGE_POOLS[spirit.id], seed || spirit.id);

  const liqueur = present.find((i) => i.category === "liqueur");
  if (liqueur && SPIRIT_IMAGE_POOLS[liqueur.id]) return pickFrom(SPIRIT_IMAGE_POOLS[liqueur.id], seed || liqueur.id);

  return pickFrom(DEFAULT_IMAGES, seed || "default");
}