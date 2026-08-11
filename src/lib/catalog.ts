import serum from "@/assets/p-serum.jpg";
import cream from "@/assets/p-cream.jpg";
import lipstick from "@/assets/p-lipstick.jpg";
import hair from "@/assets/p-hair.jpg";

export const BRAND_NAME = "Nills Mart";

/** Store contact details shown in the footer. */
export const CONTACT = {
  address: "325/1 Dewan City, Sector 6, Uttara, Dhaka -1230",
  phone: "01774809872",
  email: "support@nillsmart.com",
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brandSlug: string;
  image: string;
  size: string;
  sku: string;
  price: number;
  listPrice: number;
  stock: number;
  bestSeller?: boolean;
  onOffer?: boolean;
  published?: boolean;
  categories: string[];
  concerns: string[];
  brief: string;
  ingredients: string;
  howToUse: string;
  rating: number;
  reviews: number;
};

export type Brand = { slug: string; name: string; top?: boolean; origin: string };

export const brands: Brand[] = [
  { slug: "radiant-skin-co", name: "Radiant Skin Co.", top: true, origin: "Korea" },
  { slug: "noorja-beauty-lab", name: "Noorja Beauty Lab", top: true, origin: "Bangladesh" },
  { slug: "aurelia-botanics", name: "Aurelia Botanics", top: true, origin: "France" },
  { slug: "hikari-derm", name: "Hikari Derm", top: true, origin: "Japan" },
  { slug: "meraki-colour", name: "Meraki Colour", top: true, origin: "Italy" },
  { slug: "tulsi-roots", name: "Tulsi & Roots", origin: "India" },
  { slug: "coastline-care", name: "Coastline Care", origin: "Thailand" },
  { slug: "atelier-nine", name: "Atelier Nine", origin: "UK" },
  { slug: "bloom-baby", name: "Bloom Baby", origin: "Bangladesh" },
  { slug: "north-mens-co", name: "North Men's Co.", origin: "USA" },
];

export const categories = [
  {
    slug: "skin-care",
    name: "Skin Care",
    children: ["Facewash", "Toner", "Moisturizer", "Masks & Peels", "Scrubs & Exfoliators"],
  },
  { slug: "makeup", name: "Makeup", children: ["Lips", "Face", "Eyes", "Nails"] },
  {
    slug: "hair-care",
    name: "Hair Care",
    children: ["Shampoo", "Conditioner", "Hair Oil", "Serum"],
  },
  { slug: "body-care", name: "Body Care", children: ["Body Wash", "Lotion", "Hand Care"] },
  { slug: "fragrance", name: "Fragrance", children: ["Perfume", "Body Mist", "Attar"] },
  { slug: "baby-care", name: "Baby Care", children: ["Bath", "Lotion", "Diapering"] },
  { slug: "men-care", name: "Men Care", children: ["Shaving", "Face Care", "Hair"] },
  { slug: "jewellery", name: "Jewellery", children: ["Earrings", "Necklace", "Rings"] },
  { slug: "accessories", name: "Accessories", children: ["Brushes", "Tools", "Bags"] },
  { slug: "daily-needs", name: "Daily Needs", children: ["Oral Care", "Hygiene", "Tissue"] },
];

/**
 * The single list of shoppable concerns.
 *
 * The home page tiles and this list used to be two separate arrays with only
 * two entries in common, both rendered under the heading "Shop by Concern" —
 * so a concern seen on the home page appeared to have been removed when the
 * shopper looked for it on /categories. `query` is what gets searched; `sub`
 * is the qualifier shown on the home tiles.
 */
export type Concern = { title: string; sub: string; query: string };

export const concerns: Concern[] = [
  { title: "Acne", sub: "Treatment", query: "acne" },
  { title: "Anti Aging", sub: "Treatment", query: "anti aging" },
  { title: "Dandruff", sub: "Solution", query: "dandruff" },
  { title: "Dry Skin", sub: "Treatment", query: "dry skin" },
  { title: "Hair Fall", sub: "Treatment", query: "hair fall" },
  { title: "Oil Control", sub: "Treatment", query: "oil control" },
  { title: "Pigmentation", sub: "Treatment", query: "pigmentation" },
  { title: "Pore Care", sub: "Care", query: "pore" },
  { title: "Sun Protection", sub: "Care", query: "sun" },
  { title: "Hair Thinning", sub: "Solution", query: "hair thinning" },
];

const img = { serum, cream, lipstick, hair };

/**
 * Stand-in artwork for products whose image_url is not set yet.
 * Deterministic, so a given product always gets the same placeholder.
 */
export function fallbackImageFor(slug: string): string {
  const pool = [serum, cream, lipstick, hair];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

type Seed = [
  string,
  string,
  keyof typeof img,
  string,
  number,
  number,
  number,
  string[],
  string[],
  boolean?,
];

const seeds: Seed[] = [
  [
    "Vitamin C Glow Serum",
    "radiant-skin-co",
    "serum",
    "30 ml",
    1450,
    1890,
    6,
    ["Skin Care", "Serum"],
    ["Dull Skin", "Pigmentation"],
    true,
  ],
  [
    "Barrier Repair Moisturizer",
    "hikari-derm",
    "cream",
    "50 ml",
    1290,
    1690,
    14,
    ["Skin Care", "Moisturizer"],
    ["Anti Aging"],
  ],
  [
    "Velvet Matte Lipstick",
    "meraki-colour",
    "lipstick",
    "3.8 g",
    890,
    1150,
    3,
    ["Makeup", "Lips"],
    [],
    true,
  ],
  [
    "Rice Water Hair Duo",
    "tulsi-roots",
    "hair",
    "300 ml",
    1150,
    1450,
    22,
    ["Hair Care", "Shampoo"],
    [],
  ],
  [
    "Niacinamide Oil Control Serum",
    "noorja-beauty-lab",
    "serum",
    "30 ml",
    990,
    1250,
    9,
    ["Skin Care", "Serum"],
    ["Oil Control", "Acne Treatment"],
  ],
  [
    "Ceramide Night Cream",
    "aurelia-botanics",
    "cream",
    "45 ml",
    2150,
    2690,
    5,
    ["Skin Care", "Moisturizer"],
    ["Anti Aging", "Dull Skin"],
    true,
  ],
  [
    "Mineral Sunscreen SPF 50+",
    "hikari-derm",
    "cream",
    "50 ml",
    1390,
    1590,
    18,
    ["Skin Care", "Sunscreen"],
    ["Sun Protection", "Tan Removal"],
  ],
  [
    "Argan Repair Hair Oil",
    "coastline-care",
    "hair",
    "100 ml",
    760,
    950,
    27,
    ["Hair Care", "Hair Oil"],
    [],
  ],
  [
    "Rose Clay Purifying Mask",
    "aurelia-botanics",
    "cream",
    "75 g",
    840,
    1090,
    11,
    ["Skin Care", "Masks & Peels"],
    ["Acne Treatment", "Oil Control"],
  ],
  ["Satin Tint Lip Balm", "meraki-colour", "lipstick", "4 g", 650, 790, 31, ["Makeup", "Lips"], []],
  [
    "Gentle Foaming Facewash",
    "noorja-beauty-lab",
    "serum",
    "150 ml",
    540,
    690,
    40,
    ["Skin Care", "Facewash"],
    ["Oil Control"],
  ],
  [
    "Beard & Face Grooming Oil",
    "north-mens-co",
    "hair",
    "50 ml",
    720,
    890,
    8,
    ["Men Care", "Hair"],
    [],
  ],
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const products: Product[] = seeds.map((s, i) => ({
  id: String(i + 1),
  slug: slugify(s[0]),
  name: s[0],
  brandSlug: s[1],
  image: img[s[2]],
  size: s[3],
  sku: `${s[0].slice(0, 3).toUpperCase()}-${1000 + i}`,
  price: s[4],
  listPrice: s[5],
  stock: s[6],
  categories: s[7],
  concerns: s[8],
  bestSeller: s[9],
  brief: `${s[0]} from ${brands.find((b) => b.slug === s[1])?.name}. Dermatologist-tested, cruelty free and formulated for humid South Asian weather.`,
  ingredients:
    "Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Tocopherol, Citric Acid, Phenoxyethanol.",
  howToUse:
    "Apply a small amount to clean skin morning and night. Follow with moisturizer and sunscreen during the day.",
  rating: 4.3 + (i % 6) / 10,
  reviews: 18 + i * 7,
}));

export const brandName = (slug: string) => brands.find((b) => b.slug === slug)?.name ?? slug;

export const discount = (p: Product) =>
  p.listPrice > p.price ? Math.round(((p.listPrice - p.price) / p.listPrice) * 100) : 0;

export const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;

// Must match DELIVERY_FEE_* in backend/app/core/config.py — the API recomputes
// the order total from its own copy, and a mismatch would surprise the customer.
export const DELIVERY_INSIDE_DHAKA = 79;
export const DELIVERY_OUTSIDE_DHAKA = 119;

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);

/** Category names the API stores for products belonging to this category slug. */
export const categoryNames = (slug: string): string[] => {
  const cat = categoryBySlug(slug);
  return cat ? [cat.name, ...cat.children].map((n) => n.toLowerCase()) : [];
};

/** Filters an already-fetched product list; the API is the source of the list. */
export const inCategory = (list: Product[], slug: string) => {
  const names = categoryNames(slug);
  if (!names.length) return [];
  return list.filter((p) => p.categories.some((c) => names.includes(c.toLowerCase())));
};

export const countInCategory = (list: Product[], slug: string) => inCategory(list, slug).length;
