import { useQuery } from "@tanstack/react-query"
import { OpenAPI } from "../client/core/OpenAPI"
import { request } from "../client/core/request"

export interface MemoryProgress {
  total_xp: number
  level: number
  level_xp: number
  next_level_xp: number
  streak: number
  best_streak: number
  saved_memories: number
  active_dates: string[]
  today: string
  timezone: string
}

export default function useMemoryProgress() {
  return useQuery({
    queryKey: ["memoryProgress"],
    queryFn: () =>
      request<MemoryProgress>(OpenAPI, {
        method: "GET",
        url: "/api/v1/progress/",
      }),
    staleTime: 30_000,
  })
}
