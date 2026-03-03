import {useQuery} from "@tanstack/react-query";
import {fetchHomeState} from "../api/homeApi";
import type {HomeState} from "../types";
import type {HomeId} from "../config/home";

export function useHomeState(homeId: HomeId, enabled: boolean) {
  return useQuery<HomeState, Error>({
    queryKey: ["homeState", homeId],
    queryFn: () => fetchHomeState(homeId),
    enabled,
    retry: false,

    placeholderData: undefined,
    staleTime: 0,
  });
}
