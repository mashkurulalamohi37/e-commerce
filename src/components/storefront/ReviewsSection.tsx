import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, MessageSquare, Star, User } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { averageRating, questionsQueryOptions, reviewsQueryOptions } from "@/lib/review-queries";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField, fieldProps } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";

const MAX_COMMENT = 1000;
const MAX_QUESTION = 500;

export type { ReviewItem, QuestionItem } from "@/lib/review-queries";

export function ReviewsSection({
  productId,
  section,
}: {
  productId: string;
  section: "reviews" | "questions";
}) {
  return section === "reviews" ? (
    <Reviews productId={productId} />
  ) : (
    <Questions productId={productId} />
  );
}

function Reviews({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: reviews = [], isPending, isError } = useQuery(reviewsQueryOptions(productId));

  const submit = useMutation({
    mutationFn: () =>
      apiFetch("/feedback/reviews", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, rating, comment: comment.trim() }),
      }),
    onSuccess: () => {
      toast.success("Thank you! Your review has been posted.");
      void queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      setComment("");
      setRating(5);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const average = averageRating(reviews);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-baseline gap-2">
        <h3 className="font-display text-lg font-semibold">
          Customer reviews {reviews.length > 0 && `(${reviews.length})`}
        </h3>
        {average !== null && (
          <span className="text-sm text-muted-foreground">
            Average {average.toFixed(1)} out of 5
          </span>
        )}
      </div>

      {user ? (
        <form
          className="space-y-3 rounded-xl border border-border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!comment.trim()) {
              toast.error("Please write a few words about the product.");
              return;
            }
            submit.mutate();
          }}
        >
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-muted-foreground">Your rating</legend>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  // Each star needs its own label, or a screen reader announces
                  // five identical unlabelled buttons.
                  aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                  aria-pressed={star === rating}
                  onClick={() => setRating(star)}
                  className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  <Star
                    className={
                      star <= rating
                        ? "size-5 fill-rating text-rating"
                        : "size-5 text-muted-foreground"
                    }
                  />
                </button>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">{rating} of 5</span>
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="review-comment">Your review</Label>
            <Textarea
              id="review-comment"
              required
              rows={3}
              maxLength={MAX_COMMENT}
              placeholder="How did it work for you?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {comment.length}/{MAX_COMMENT}
            </p>
          </div>

          <Button type="submit" size="sm" disabled={submit.isPending}>
            {submit.isPending ? "Posting…" : "Post review"}
          </Button>
        </form>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="font-semibold text-link underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Reviews couldn't be loaded right now.
        </p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews yet for this product. Be the first to write one.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="space-y-1.5 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-muted text-[10px] font-bold">
                    {r.author_name.trim().charAt(0).toUpperCase() || <User className="size-3" />}
                  </span>
                  <span className="text-sm font-semibold">{r.author_name}</span>
                  {r.verified_purchase && (
                    <span className="inline-flex items-center gap-1 rounded bg-success-surface px-1.5 py-0.5 text-[10px] font-medium text-success">
                      <CheckCircle className="size-2.5" /> Verified purchase
                    </span>
                  )}
                </div>
                <span className="flex items-center" aria-label={`Rated ${r.rating} out of 5`}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className={
                        i < r.rating
                          ? "size-3 fill-rating text-rating"
                          : "size-3 text-muted-foreground"
                      }
                    />
                  ))}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Questions({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [askerName, setAskerName] = useState("");

  const { data: questions = [], isPending, isError } = useQuery(questionsQueryOptions(productId));

  const submit = useMutation({
    mutationFn: () =>
      apiFetch("/feedback/questions", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          question: question.trim(),
          asker_name: (askerName.trim() || user?.full_name || "Customer").slice(0, 120),
        }),
      }),
    onSuccess: () => {
      toast.success("Question submitted. Our team will answer shortly.");
      void queryClient.invalidateQueries({ queryKey: ["questions", productId] });
      setQuestion("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 pt-2">
      <h3 className="font-display text-lg font-semibold">Questions &amp; answers</h3>

      <form
        className="space-y-3 rounded-xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!question.trim()) {
            toast.error("Please type your question first.");
            return;
          }
          submit.mutate();
        }}
      >
        {!user && (
          // "Optional" was a placeholder restating the label; it belongs in the
          // hint, where it stays visible once the field has text in it.
          <FormField
            id="qa-name"
            label="Your name"
            hint="Optional — we show “Customer” if you leave it blank."
          >
            <Input
              {...fieldProps(
                "qa-name",
                undefined,
                "Optional — we show “Customer” if you leave it blank.",
              )}
              maxLength={120}
              value={askerName}
              onChange={(e) => setAskerName(e.target.value)}
            />
          </FormField>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="qa-question">Your question</Label>
          <Textarea
            id="qa-question"
            required
            rows={2}
            maxLength={MAX_QUESTION}
            placeholder="Ask about shade, texture or suitability…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" disabled={submit.isPending}>
          {submit.isPending ? "Sending…" : "Ask question"}
        </Button>
      </form>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading questions…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Questions couldn't be loaded right now.
        </p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No questions yet. Ask anything about shade, texture or suitability and our beauty advisors
          will answer.
        </p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="space-y-1.5 rounded-lg border border-border p-3">
              <p className="flex items-start gap-1.5 text-sm font-semibold">
                <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-link" />
                {q.question}
              </p>
              {q.answer ? (
                <p className="pl-5 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Answer: </span>
                  {q.answer}
                </p>
              ) : (
                <p className="pl-5 text-xs italic text-muted-foreground">
                  Awaiting an answer from our team.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
