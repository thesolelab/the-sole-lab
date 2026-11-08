export const BRANDS_2K27 = [
  "Nike", "Jordan", "Converse", "adidas", "Puma",
  "New Balance", "Reebok", "Under Armour", "Anta",
  "Li-Ning", "AND 1", "Peak", "Rigorer", "Qiaodan",
  "361", "Skechers", "741", "2K Brand"
];

export const MATERIALS_2K27 = [
  "Default", "Rubber", "Metal", "Suede", "Leather",
  "Patent Leather", "Velvet", "Fabric", "Mesh",
  "Crocodile", "Denim Fabric", "Felt Fabric",
  "Fleece Fabric", "Knit Fabric",
  "Engineered Knit Fabric", "Synthetic Fabric",
  "Velvet Fabric", "Glitter", "Classic Leather",
  "Pebble Leather", "Rugged Leather", "Athletic Mesh",
  "Brushed Linear Metal", "Checker Metal",
  "Chrome Metal", "Diamond Metal", "Roundhole Metal",
  "Microfiber", "Ostrich", "Dull Plastic",
  "Semi-shiny Plastic", "Shiny Plastic",
  "Pebble Rubber", "Turing Rubber", "Sequins",
  "Snake", "Fine Suede", "Basket Weave",
  "Birdeye Weave", "Honeycomb Weave",
  "Reversed Honeycomb Weave", "Tabby Weave",
  "Twill Weave"
];

export const PATTERNS_2K27 = Array.from(
  { length: 29 },
  (_, i) => ({
    id: `pattern-${String(i + 1).padStart(2, "0")}`,
    image: `assets/patterns/pattern-${String(i + 1).padStart(2, "0")}.jpg`,
    page: i < 20 ? 1 : 2
  })
);
