import {useMutation, useQueryClient} from "@tanstack/react-query";
import {setAlarm} from "../api/homeApi";
import type {HomeState} from "../types";
import type { HomeId } from "../config/home";

export function useAlarmMutation(homeId: HomeId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (armed: boolean) => setAlarm(homeId, armed),

    onMutate: async (armed) => {
      await queryClient.cancelQueries({queryKey: ["homeState", homeId]});

      const prev = queryClient.getQueryData<HomeState>(["homeState", homeId]);

      if (prev) {
        queryClient.setQueryData<HomeState>(["homeState", homeId], {
          ...prev,
          security: {
            ...prev.security,
            alarm: {
              ...prev.security.alarm,
              armed,
              triggered: armed ? prev.security.alarm.triggered : false,
            },
          },
        });
      }

      return {prev};
    },

    onError: (_err, _armed, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData<HomeState>(["homeState", homeId], ctx.prev);
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData<HomeState>(["homeState", homeId], data);
    },
  });
}
