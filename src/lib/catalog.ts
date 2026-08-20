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
  { slug: "galenia-skin-care", name: "Galenia Skin Care", top: true, origin: "Italy" },
  { slug: "swiss-formula", name: "Swiss Formula", top: true, origin: "Switzerland" },
  { slug: "lipiol", name: "Lipiol Derm", top: true, origin: "Italy" },
  { slug: "sebotic", name: "Sebotic Care", top: true, origin: "Italy" },
  { slug: "keralise", name: "Keralise Lab", top: true, origin: "Italy" },
  { slug: "lenus", name: "Lenus Body", origin: "Italy" },
  { slug: "micoxil", name: "Micoxil Active", origin: "Italy" },
  { slug: "protelion", name: "Protelion Sun", origin: "Italy" },
];

export const categories = [
  {
    slug: "skin-care",
    name: "Skin Care",
    children: ["Facewash", "Moisturizer", "Serum", "Sunscreen", "Scrubs & Exfoliators"],
  },
  {
    slug: "hair-care",
    name: "Hair Care",
    children: ["Shampoo", "Serum"],
  },
  {
    slug: "body-care",
    name: "Body Care",
    children: ["Lotion"],
  },
];

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

export function fallbackImageFor(slug: string): string {
  const pool = [serum, cream, lipstick, hair];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

type Seed = {
  name: string;
  brandSlug: string;
  image: string;
  size: string;
  price: number;
  listPrice: number;
  stock: number;
  categories: string[];
  concerns: string[];
  bestSeller?: boolean;
  onOffer?: boolean;
  brief: string;
};

const seeds: Seed[] = [
  {
    name: "SEBOTIC PHYSIOLOGICAL SHAMPOO 200 ML",
    brandSlug: "sebotic",
    image: "/catalog/SEBOTIC--Physiological-Shampoo.png",
    size: "200 ML",
    price: 2240,
    listPrice: 2576,
    stock: 15,
    categories: ["Hair Care", "Shampoo"],
    concerns: ["Dandruff", "Hair Fall"],
    bestSeller: true,
    onOffer: true,
    brief:
      "Daily delicate cleanser for hair and sensitive scalp providing volume and resistance. This delicate cleansing formula for daily hygiene strengthens fine, weak hair and sensitive scalp areas. Galenia S",
  },
  {
    name: "MICOXIL (Antimycotic Active Cleanser) 250 ML",
    brandSlug: "micoxil",
    image: "/catalog/MICOXIL--Active-Cleanser.png",
    size: "250 ML",
    price: 2290,
    listPrice: 2633,
    stock: 18,
    categories: ["Skin Care", "Facewash"],
    concerns: [],
    bestSeller: false,
    onOffer: true,
    brief:
      "Facial, body and hair cleansing adjuvant\u00a0for the preventionof superficial fungal problematics. Recommended for daily use. Suitable for those at risk of contracting cutaneous or scalp mycosis, creating",
  },
  {
    name: "LIPIOL EMULSIONE (Intensive Emulsion) 250 ML",
    brandSlug: "lipiol",
    image: "/catalog/LIPIOL--Emulsione.png",
    size: "250 ML",
    price: 3290,
    listPrice: 3783,
    stock: 21,
    categories: ["Skin Care", "Moisturizer"],
    concerns: ["Dry Skin"],
    bestSeller: false,
    onOffer: true,
    brief:
      "LIPIOL EMULSIONE (intensive emulsion) is a moisturizing lotion with elevated hydration. It is a nourishing, keratolytic, calming and protective moisturizer for the treatment of very dry, chapped and s",
  },
  {
    name: "SWISS-FORMULA(Hair Serum) 0 ML",
    brandSlug: "swiss-formula",
    image: "/catalog/SWISS-FORMULA--Hair-Serum.png",
    size: "0 ML",
    price: 1670,
    listPrice: 1920,
    stock: 24,
    categories: ["Hair Care", "Shampoo"],
    concerns: ["Hair Fall"],
    bestSeller: true,
    onOffer: true,
    brief:
      "Swiss Formula Hair Serum is a premium hair care solution designed to nourish, protect, and revitalize your hair. Enriched with high-quality ingredients, this lightweight serum deeply hydrates and stre",
  },
  {
    name: "LENUS (Soothing Body Lotion) 150 ML",
    brandSlug: "lenus",
    image: "/catalog/KERALISE--Mousse.png",
    size: "150 ML",
    price: 2240,
    listPrice: 2576,
    stock: 27,
    categories: ["Body Care", "Lotion"],
    concerns: [],
    bestSeller: false,
    onOffer: true,
    brief:
      "LENUS (intensive, refreshing\u00a0and soothing body lotion)\u00a0contains Polidocanol, Glycerin and Ocean Algae which are distributed in an exclusive silicon emulsion that has a pleasant energetic, long lasting",
  },
  {
    name: "SWISS-FORMULA(Face Serum) 0 ML",
    brandSlug: "swiss-formula",
    image: "/catalog/SWISS-FORMULA--Face-Serum.png",
    size: "0 ML",
    price: 1990,
    listPrice: 2288,
    stock: 30,
    categories: ["Skin Care", "Serum"],
    concerns: ["Acne Treatment"],
    bestSeller: false,
    onOffer: true,
    brief:
      "Known to boost production of Collagen; the proteins present in Vitamin C Serum are known to help improve the elasticity of the skin and tighten the poresThe serum is known to help unclog the pores, re",
  },
  {
    name: "LIPIOL OLIO DETERGENTE (Cleansing Oil) 40 ML",
    brandSlug: "lipiol",
    image: "/catalog/LIPIOL--Olio-Detergente.png",
    size: "40 ML",
    price: 3290,
    listPrice: 3783,
    stock: 33,
    categories: ["Skin Care"],
    concerns: ["Dry Skin"],
    bestSeller: true,
    onOffer: true,
    brief:
      "moisturizing, nourishing and lipid replenishing creamLIPIOL VISO (intensive facial cream) is a well-tolerated lipid replenshing, nourishing cosmetic and emollient aid based on panthenol and ceramides ",
  },
  {
    name: "KERALISE (Crema Comedolytic ) 30 ML",
    brandSlug: "keralise",
    image: "/catalog/KERALISE--Crema-Comedolitica.png",
    size: "30 ML",
    price: 2240,
    listPrice: 2576,
    stock: 36,
    categories: ["Skin Care"],
    concerns: ["Acne Treatment"],
    bestSeller: false,
    onOffer: true,
    brief:
      "KERALISE (comedolytic cream) which exfoliates, purifies and soothes, contains Retinol that is released directly into the pilosebaceous follicles and conveyed in microspheres (liposomes). This encourag",
  },
  {
    name: "SEBOTIC ANTI-DANDRUFF SHAMPOO 125 ML",
    brandSlug: "sebotic",
    image: "/catalog/SEBOTIC--Anti-Dandruff-Shampoo.png",
    size: "125 ML",
    price: 2240,
    listPrice: 2576,
    stock: 39,
    categories: ["Hair Care", "Shampoo"],
    concerns: ["Dandruff"],
    bestSeller: false,
    onOffer: true,
    brief:
      "SEBOTIC\u00a0ANTI-DANDRUFF SHAMPOO\u00a0is a complete dermocosmetic cleanser used for treating dry and greasy dandruff and intense flaky conditions of the scalp, body and beards.\u00a0 The powerful anti-dandruff syn",
  },
  {
    name: "KERALISE GEL SCRUB 30 ML",
    brandSlug: "keralise",
    image: "/catalog/KERALISE--Gel-Scrub.png",
    size: "30 ML",
    price: 2140,
    listPrice: 2461,
    stock: 17,
    categories: ["Skin Care", "Facewash"],
    concerns: ["Acne Treatment", "Dry Skin"],
    bestSeller: true,
    onOffer: true,
    brief:
      "Triple Effect: Exfoliating, Purifying and Soothing.KERALISE GEL SCRUB is designed for daily cleansing of greasy skin inclined to acne. The dual exfoliating mechanism ensures a purifying cleanser with ",
  },
  {
    name: "LIPIOL BASE (Moisturizing Cream) 500 ML",
    brandSlug: "lipiol",
    image: "/catalog/LIPIOL--Crema-Detergente.png",
    size: "500 ML",
    price: 3990,
    listPrice: 4588,
    stock: 20,
    categories: ["Skin Care", "Moisturizer"],
    concerns: ["Dry Skin"],
    bestSeller: false,
    onOffer: true,
    brief:
      "For normal, dry and extremely dry skinLIPIOL BASE is a restructuring cream, with elevated lipid content, which moisturizes for the protection of normal, dry and extremely dry skin.\u00a0 Containing functio",
  },
  {
    name: "LIPIOL VISO (Intensive Facial Cream) 40 ML",
    brandSlug: "lipiol",
    image: "/catalog/LIPIOL--Viso.png",
    size: "40 ML",
    price: 2240,
    listPrice: 2576,
    stock: 23,
    categories: ["Skin Care", "Moisturizer"],
    concerns: ["Dry Skin"],
    bestSeller: false,
    onOffer: true,
    brief:
      "LIPIOL VISO (intensive facial cream) is a well-tolerated lipid replenshing, nourishing cosmetic and emollient aid based on panthenol and ceramides formulated for the most demanding conditions of dryne",
  },
  {
    name: "HY-SERUM--Hyaluronic-Acid 0 ML",
    brandSlug: "galenia-skin-care",
    image: "/catalog/HY-SERUM--Hyaluronic-Acid.png",
    size: "0 ML",
    price: 4290,
    listPrice: 4933,
    stock: 26,
    categories: ["Skin Care", "Serum"],
    concerns: [],
    bestSeller: true,
    onOffer: true,
    brief:
      "Galenia Skin Care HY Serum\u00a0is a highly concentrated hyaluronic acid facial serum designed to deliver intense hydration and anti-aging benefits. It combines hyaluronic acid with other active substances",
  },
  {
    name: "PROTELION 50 EMULSION - EMULSIONE (UVB + UVA / SPF 50 for Oily & Sensitive Skin) 50 ML",
    brandSlug: "protelion",
    image: "/catalog/PROTELION50--Emulsion.png",
    size: "50 ML",
    price: 2140,
    listPrice: 2461,
    stock: 29,
    categories: ["Skin Care", "Moisturizer"],
    concerns: ["Dry Skin", "Sun Protection"],
    bestSeller: false,
    onOffer: true,
    brief:
      "facial sunscreen for oily and sensitive skinElevated sun protection. Containing Sweet Almond Oil and Rice Oil.\u00a0 Delicate\u00a0 on\u00a0oily and sensitive\u00a0skin,\u00a0 avoiding\u00a0 dehydration.\u00a0 Association with\u00a0 physica",
  },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const products: Product[] = seeds.map((s, i) => ({
  id: String(i + 1),
  slug: slugify(s.name),
  name: s.name,
  brandSlug: s.brandSlug,
  image: s.image,
  size: s.size,
  sku: `NILL-${1000 + i}`,
  price: s.price,
  listPrice: s.listPrice,
  stock: s.stock,
  categories: s.categories,
  concerns: s.concerns,
  bestSeller: s.bestSeller,
  onOffer: s.onOffer,
  published: true,
  brief: s.brief,
  ingredients: "Aqua, Glycerin, Panthenol, Ceramides, Tocopherol, Citric Acid, Phenoxyethanol.",
  howToUse: "Apply a small amount to clean skin or hair morning and night as directed on package.",
  rating: 4.4 + (i % 5) / 10,
  reviews: 24 + i * 5,
}));

export const brandName = (slug: string) => brands.find((b) => b.slug === slug)?.name ?? slug;

export const discount = (p: Product) =>
  p.listPrice > p.price ? Math.round(((p.listPrice - p.price) / p.listPrice) * 100) : 0;

export const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;

export const DELIVERY_INSIDE_DHAKA = 79;
export const DELIVERY_OUTSIDE_DHAKA = 119;

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);

export const categoryNames = (slug: string): string[] => {
  const cat = categoryBySlug(slug);
  return cat ? [cat.name, ...cat.children].map((n) => n.toLowerCase()) : [];
};

export const inCategory = (list: Product[], slug: string) => {
  const names = categoryNames(slug);
  if (!names.length) return [];
  return list.filter((p) => p.categories.some((c) => names.includes(c.toLowerCase())));
};

export const countInCategory = (list: Product[], slug: string) => inCategory(list, slug).length;
