import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Star, Trash2, CheckCircle2, HelpCircle, Send } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";

export interface ReviewItem {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface QuestionItem {
  id: string;
  product_id: string;
  asker_name: string;
  question: string;
  answer?: string;
  published: boolean;
  created_at: string;
}

export function ReviewsPanel() {
  const queryClient = useQueryClient();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<ReviewItem[]>({
    queryKey: ["admin", "reviews"],
    queryFn: () => apiFetch("/feedback/reviews/admin/list"),
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<QuestionItem[]>({
    queryKey: ["admin", "questions"],
    queryFn: () => apiFetch("/feedback/questions/admin/list"),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/feedback/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const answerQuestionMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      apiFetch(`/feedback/questions/${id}/answer`, {
        method: "PATCH",
        body: JSON.stringify({ answer, published: true }),
      }),
    onSuccess: () => {
      toast.success("Answer published!");
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
      setReplyingId(null);
      setAnswerText("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="reviews" className="w-full space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2 rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="reviews" className="font-bold">
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="font-bold">
            Questions ({questions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          {isLoadingReviews ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Star className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-bold text-foreground">No customer reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-card/90 p-4.5 shadow-card backdrop-blur-sm sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex text-rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${i < r.rating ? "fill-current" : "text-muted"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-foreground">{r.author_name}</span>
                      {r.verified_purchase && (
                        <span className="inline-flex items-center gap-1 rounded bg-success-surface px-1.5 py-0.5 text-[10px] font-bold text-success">
                          <CheckCircle2 className="size-3" /> Verified purchase
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{r.comment}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <ConfirmDelete
                    itemName={`Review by ${r.author_name}`}
                    description="Are you sure you want to delete this customer review?"
                    onConfirm={() => deleteReviewMutation.mutate(r.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-end text-xs text-destructive hover:bg-destructive/10 sm:self-center"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </ConfirmDelete>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions">
          {isLoadingQuestions ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading questions…</p>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <HelpCircle className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-bold text-foreground">
                No customer questions submitted yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-card backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground">
                        Asked by {q.asker_name}
                      </span>
                      <p className="mt-1 text-sm font-bold text-foreground">Q: {q.question}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {q.answer ? (
                    <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs">
                      <span className="font-bold text-link">Admin Response:</span>
                      <p className="mt-0.5 text-foreground">{q.answer}</p>
                    </div>
                  ) : replyingId === q.id ? (
                    <div className="mt-3 space-y-2">
                      <Input
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your answer…"
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs font-bold"
                          onClick={() =>
                            answerQuestionMutation.mutate({ id: q.id, answer: answerText })
                          }
                        >
                          <Send className="size-3" /> Publish Answer
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5 text-xs font-bold"
                      onClick={() => {
                        setReplyingId(q.id);
                        setAnswerText("");
                      }}
                    >
                      <MessageSquare className="size-3" /> Answer Question
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
