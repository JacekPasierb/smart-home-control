import {useQuery} from "@tanstack/react-query";
import {fetchHomeState} from "../api/homeApi";
import type {HomeState} from "../types";
import type { HomeId } from "../config/home";

export function useHomeState(homeId: HomeId) {
  return useQuery<HomeState>({
    queryKey: ["homeState", homeId],
    queryFn: () => fetchHomeState(homeId),
  });
}
