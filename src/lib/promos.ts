import b1 from "@/assets/brand-banner-1.jpg";
import b2 from "@/assets/brand-banner-2.jpg";
import b3 from "@/assets/brand-banner-3.jpg";
import b4 from "@/assets/brand-banner-4.jpg";
import b5 from "@/assets/brand-banner-5.jpg";
import b6 from "@/assets/brand-banner-6.jpg";

export type Promo = {
  slug: string;
  image: string;
  alt: string;
  headline: string;
  sub: string;
  tone: "light" | "dark";
  /** Search term used to build the filtered product listing. */
  query: string;
  blurb: string;
};

export const promos: Promo[] = [
  {
    slug: "grooming-essentials",
    image: b1,
    alt: "Grooming trimmer offer banner",
    headline: "The only trimmer you'll ever need",
    sub: "Grooming essentials",
    tone: "light",
    query: "grooming",
    blurb: "Trimmers, beard oils and men's grooming picks, delivered nationwide.",
  },
  {
    slug: "summer-body-wash",
    image: b2,
    alt: "Summer body wash offer banner",
    headline: "Summer perfect protection",
    sub: "Up to 50% off",
    tone: "dark",
    query: "body wash",
    blurb: "Cooling body washes and shower gels for humid Bangladeshi summers.",
  },
  {
    slug: "herbal-hair-oils",
    image: b3,
    alt: "Herbal hair oil brand banner",
    headline: "Introducing herbal hair oils",
    sub: "Naturals collection",
    tone: "light",
    query: "hair oil",
    blurb: "Cold-pressed and herbal hair oils for stronger, shinier hair.",
  },
  {
    slug: "treasure-of-glow",
    image: b4,
    alt: "Skincare bundle offer banner",
    headline: "Treasure of glow",
    sub: "Up to 35% off + free delivery",
    tone: "dark",
    query: "skin care",
    blurb: "Cleansers, moisturizers and masks bundled at bundle-only pricing.",
  },
  {
    slug: "serum-edit",
    image: b5,
    alt: "Serum sale banner",
    headline: "Serum edit",
    sub: "Up to 33% off",
    tone: "dark",
    query: "serum",
    blurb: "Vitamin C, niacinamide and barrier serums from verified labs.",
  },
  {
    slug: "soft-skin-body-care",
    image: b6,
    alt: "Shower gel offer banner",
    headline: "Soft skin",
    sub: "Body care picks",
    tone: "dark",
    query: "body care",
    blurb: "Lotions, hand care and body essentials for everyday softness.",
  },
];

export const promoBySlug = (slug: string) => promos.find((p) => p.slug === slug);
