export const LoadingStateType = {
  LOAD_MORE: 1,
  FETCHING: 2,
} as const;

export type LoadingStateType =
  (typeof LoadingStateType)[keyof typeof LoadingStateType];