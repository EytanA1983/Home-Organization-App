/** GET /api/dashboard/daily-inspiration | daily-tip */

export type DailyInspirationRead = {
  date: string;
  quote: string;
};

export type DailyTipContextRead = {
  room: string | null;
  reason: string;
};

export type DailyTipRead = {
  date: string;
  tip: string;
  context: DailyTipContextRead;
};
