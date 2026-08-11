import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export interface ReviewItem {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface QuestionItem {
  id: string;
  asker_name: string;
  question: string;
  answer?: string | null;
  created_at: string;
}

/**
 * Shared by the product page header and the Reviews tab.
 *
 * The header used to render the product's stored `rating`/`reviews_count` while
 * the tab computed its own average from this list. The API never recomputes the
 * stored aggregate when a review is posted, so the two numbers drifted apart
 * permanently and the same page showed two different ratings. Both now read
 * from here.
 */
export const reviewsQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: ["reviews", productId],
    queryFn: () => apiFetch<ReviewItem[]>(`/feedback/reviews/${productId}`, { anonymous: true }),
    staleTime: 30_000,
  });

export const questionsQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: ["questions", productId],
    queryFn: () =>
      apiFetch<QuestionItem[]>(`/feedback/questions/${productId}`, { anonymous: true }),
    staleTime: 30_000,
  });

/** Average to one decimal, or null when there is nothing to average. */
export function averageRating(reviews: ReviewItem[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
