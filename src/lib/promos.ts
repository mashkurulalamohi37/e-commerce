export type Promo = {
  slug: string;
  image: string;
  alt: string;
  headline: string;
  sub: string;
  tone: "light" | "dark";
  query: string;
  blurb: string;
};

export const promos: Promo[] = [
  {
    slug: "sebotic-scalp-care",
    image: "/promos/sebotic-scalp-care.jpeg",
    alt: "Sebotic Shampoo Banner",
    headline: "Sebotic Dermatological Shampoo",
    sub: "Physiological & Anti-Dandruff",
    tone: "dark",
    query: "sebotic",
    blurb: "Delicate daily hair and scalp cleansers for flaky, sensitive hair.",
  },
  {
    slug: "lipiol-skincare-range",
    image: "/promos/lipiol-skincare-range.jpeg",
    alt: "Lipiol Cleansing Oil Banner",
    headline: "Lipiol Intensive Skin Hydration",
    sub: "Cleansing Oil & Facial Cream",
    tone: "dark",
    query: "lipiol",
    blurb: "Lipid-replenishing, dermatologically tested protection for sensitive skin.",
  },
  {
    slug: "swiss-formula-serums",
    image: "/promos/swiss-formula-serums.jpeg",
    alt: "Swiss Formula Serums Banner",
    headline: "Swiss Formula Face & Hair Serums",
    sub: "Hydrating & Collagen Boosting",
    tone: "dark",
    query: "swiss",
    blurb: "High-potency hyaluronic acid and nutrient-dense revitalizing serums.",
  },
  {
    slug: "keralise-acne-care",
    image: "/promos/keralise-acne-care.jpeg",
    alt: "Keralise Comedolytic Cream Banner",
    headline: "Keralise Comedolytic & Gel Scrub",
    sub: "Purifying & Exfoliating",
    tone: "dark",
    query: "keralise",
    blurb: "Cell renewal and purifying exfoliation for acne-prone skin.",
  },
  {
    slug: "protelion-sun-protection",
    image: "/promos/protelion-sun-protection.jpeg",
    alt: "Protelion 50 Sunscreen Banner",
    headline: "Protelion 50 UVB + UVA Protection",
    sub: "SPF 50 Solar Protection",
    tone: "dark",
    query: "protelion",
    blurb: "Lightweight, non-greasy sunscreen formulated for sensitive skin.",
  },
  {
    slug: "lenus-body-care",
    image: "/promos/lenus-body-care.jpeg",
    alt: "Lenus Body Lotion Banner",
    headline: "Lenus Soothing Body Care",
    sub: "Refreshing Body Lotion",
    tone: "dark",
    query: "lenus",
    blurb: "Instant cooling relief and long-lasting hydration for reactive skin.",
  },
];

export const promoBySlug = (slug: string) => promos.find((p) => p.slug === slug);
