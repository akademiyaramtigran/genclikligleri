"use client";

import { useActionState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { voteAction, type VoteState } from "@/actions/public";
import { cn } from "@/lib/utils";

export function VoteButton({ contestantId, name, className, big }: { contestantId: string; name: string; className?: string; big?: boolean }) {
  const [state, action, pending] = useActionState<VoteState, FormData>(voteAction, null);
  return (
    <form action={action} className={className}>
      <input type="hidden" name="contestantId" value={contestantId} />
      <button
        disabled={pending || state?.ok}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full font-bold transition disabled:opacity-70",
          big ? "px-8 py-3.5 text-base" : "px-4 py-2 text-sm",
          state?.ok ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-lg shadow-fuchsia-600/30 hover:brightness-110",
        )}
        aria-label={`${name} için oy ver`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", state?.ok && "fill-current")} />}
        {state?.ok ? "Oy verildi" : "Oy Ver"}
      </button>
      {state && <p role="status" className={cn("mt-2 text-center text-xs", state.ok ? "text-emerald-300" : "text-pink-200")}>{state.message}</p>}
    </form>
  );
}
