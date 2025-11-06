import { useAuth as useBaseAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * Hook customizado que estende useAuth com informações de perfil do sistema de feedback
 */
export function useAuthWithProfile() {
  const baseAuth = useBaseAuth();
  const { data: userWithProfile, isLoading: profileLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: !!baseAuth.user,
  });

  return {
    ...baseAuth,
    user: userWithProfile || baseAuth.user,
    feedbackRole: userWithProfile?.feedbackRole || null,
    isLoading: baseAuth.loading || profileLoading,
    isMaster: userWithProfile?.feedbackRole === "MASTER",
    isDiretor: userWithProfile?.feedbackRole === "DIRETOR",
    isRevisor: userWithProfile?.feedbackRole === "REVISOR",
    isTaquigrafo: userWithProfile?.feedbackRole === "TAQUIGRAFO",
  };
}
