'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';

export function useAuth() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => pokemonApi.me().then((response) => response.data),
    retry: false,
  });

  const login = useMutation({
    mutationFn: pokemonApi.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  const register = useMutation({
    mutationFn: pokemonApi.register,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  const logout = useMutation({
    mutationFn: pokemonApi.logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    login,
    register,
    logout,
  };
}
