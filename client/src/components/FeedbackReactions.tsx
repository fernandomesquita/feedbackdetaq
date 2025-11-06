import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackReactionsProps {
  feedbackId: number;
}

const reactionConfig = {
  ENTENDI: {
    label: "Entendi",
    icon: CheckCircle2,
    color: "text-blue-500",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    borderColor: "border-blue-200",
  },
  OBRIGADO: {
    label: "Obrigado",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50 hover:bg-pink-100",
    borderColor: "border-pink-200",
  },
  VOU_MELHORAR: {
    label: "Vou Melhorar",
    icon: TrendingUp,
    color: "text-green-500",
    bgColor: "bg-green-50 hover:bg-green-100",
    borderColor: "border-green-200",
  },
};

export function FeedbackReactions({ feedbackId }: FeedbackReactionsProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.reactions.listByFeedback.useQuery({ feedbackId });

  const toggleMutation = trpc.reactions.toggle.useMutation({
    onSuccess: (result) => {
      utils.reactions.listByFeedback.invalidate({ feedbackId });
      if (result.action === "added") {
        toast.success("Reação adicionada");
      } else {
        toast.success("Reação removida");
      }
    },
    onError: () => {
      toast.error("Erro ao reagir");
    },
  });

  const handleReaction = (type: "ENTENDI" | "OBRIGADO" | "VOU_MELHORAR") => {
    toggleMutation.mutate({ feedbackId, type });
  };

  const hasUserReacted = (type: string) => {
    return data?.reactions.some((r: any) => r.type === type && r.userId === user?.id);
  };

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Object.keys(reactionConfig).map((key) => (
          <div key={key} className="h-10 w-24 bg-muted animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(reactionConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = data?.counts[type as keyof typeof data.counts] || 0;
          const userReacted = hasUserReacted(type);

          return (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => handleReaction(type as any)}
              disabled={toggleMutation.isPending}
              className={cn(
                "gap-2 transition-all",
                userReacted && `${config.bgColor} ${config.borderColor} border-2`
              )}
            >
              <Icon className={cn("h-4 w-4", userReacted && config.color)} />
              <span className={cn(userReacted && "font-semibold")}>{config.label}</span>
              {count > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Lista de quem reagiu */}
      {data && data.reactions.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {Object.entries(reactionConfig).map(([type, config]) => {
            const usersWithReaction = data.reactions.filter((r: any) => r.type === type);
            if (usersWithReaction.length === 0) return null;

            return (
              <div key={type} className="flex items-center gap-2">
                <config.icon className={cn("h-3 w-3", config.color)} />
                <span>
                  {usersWithReaction.map((r: any) => r.userName).join(", ")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
