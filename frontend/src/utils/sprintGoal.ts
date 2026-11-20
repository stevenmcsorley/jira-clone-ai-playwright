export const SPRINT_GOAL_MAX = 200;

export const goalCounter = (value: string): {
  count: number;
  text: string;
  nearLimit: boolean;
  overLimit: boolean;
} => {
  const count = value.trimEnd().length;

  return {
    count,
    text: `${count}/${SPRINT_GOAL_MAX}`,
    nearLimit: count >= 180,
    overLimit: count > SPRINT_GOAL_MAX,
  };
};
