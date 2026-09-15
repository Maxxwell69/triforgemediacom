export type AgencyLiveTraffic = {
  liveFeed: number | null;
  forYou: number | null;
  following: number | null;
  share: number | null;
  other: number | null;
};

export type AgencyLiveMetrics = {
  uniqueId: string;
  diamonds: number | null;
  giftEvents: number | null;
  uniqueGifters: number | null;
  likes: number | null;
  joins: number | null;
  battles: number | null;
  battleWins: number | null;
  liveStreams: number;
  liveDurationSeconds: number;
  validGoLiveDays: number;
  newFollowers: number | null;
  avgWatchDurationSeconds: number | null;
  impressions: number | null;
  reachedAudience: number | null;
  views: number | null;
  viewers: number | null;
  tapThroughRate: number | null;
  giftingRate: number | null;
  traffic: AgencyLiveTraffic;
  prior: {
    diamonds: number | null;
    validGoLiveDays: number | null;
    liveDurationSeconds: number | null;
    liveStreams: number | null;
    newFollowers: number | null;
    avgWatchDurationSeconds: number | null;
  } | null;
  source: {
    agencyEventsOk: boolean;
    agencyEventsError: string | null;
    daysLookback: number;
  };
};

export type AgencyRosterRow = {
  userId: string;
  name: string;
  email: string;
  uniqueId: string | null;
  avatarUrl: string | null;
  lastReport: {
    year: number;
    month: number;
    diamonds: number | null;
    ranAt: Date;
  } | null;
};
