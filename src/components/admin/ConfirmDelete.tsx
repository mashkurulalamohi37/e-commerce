import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Confirmation step for destructive admin actions. Deleting a product or a
 * banner used to happen on a single click of a small icon button, with no undo.
 */
export function ConfirmDelete({
  itemName,
  description,
  onConfirm,
  disabled,
  children,
}: {
  itemName: string;
  description?: string;
  onConfirm: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{itemName}”?</AlertDialogTitle>
          <AlertDialogDescription>{description ?? "This cannot be undone."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
