import { BRAND_NAME } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** Image height class — stacked mark+wordmark needs a bit more height. */
  imgClassName?: string;
};

/** Official Nills Mart logo (mark + wordmark). */
export function BrandLogo({ className, imgClassName }: BrandLogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}nillsmart-logo.png`}
      alt={`${BRAND_NAME} logo`}
      width={240}
      height={240}
      className={cn(
        "h-14 w-auto object-contain transition-transform duration-200 hover:scale-105",
        imgClassName,
      )}
      decoding="async"
    />
  );
}
