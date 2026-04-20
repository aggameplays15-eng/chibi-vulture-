"use client";

import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";

export const usePosts = () => {
  return useQuery({
    queryKey: ["posts"],
    queryFn: apiService.getPosts,
    staleTime: 1000 * 60 * 5, // Garde les données fraîches pendant 5 minutes
  });
};