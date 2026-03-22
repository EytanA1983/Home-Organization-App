/**
 * Curated in-app video catalog (YouTube) — categories for tips / motivation content.
 * Extend APP_VIDEOS as you add clips; wire UI (e.g. Tips hub, dashboard fallback) separately.
 */

export type VideoCategory =
  | "cleaning"
  | "kitchen"
  | "clothes"
  | "bathroom_beauty"
  | "bedroom"
  | "emotional"
  | "motivation";

export type AppVideo = {
  id: string;
  title: string;
  description?: string;
  category: VideoCategory;
  youtubeUrl: string;
  videoId: string;
  thumbnailUrl: string;
  isFeatured?: boolean;
};

export const APP_VIDEOS: AppVideo[] = [
  {
    id: "clean-home-inspiration-1",
    title: "השראה לניקיון הבית",
    description: "סרטון השראה קצר לניקיון, רענון וסדר בבית.",
    category: "cleaning",
    youtubeUrl: "https://www.youtube.com/watch?v=fAtvaypnIkY",
    videoId: "fAtvaypnIkY",
    thumbnailUrl: "https://img.youtube.com/vi/fAtvaypnIkY/hqdefault.jpg",
    isFeatured: true,
  },

  // הוסף כאן עוד סרטונים:
  // {
  //   id: "kitchen-tip-1",
  //   title: "טיפ למטבח",
  //   description: "סידור מהיר של אזור העבודה במטבח.",
  //   category: "kitchen",
  //   youtubeUrl: "https://www.youtube.com/watch?v=VIDEO_ID",
  //   videoId: "VIDEO_ID",
  //   thumbnailUrl: "https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg",
  // },
];

/** First video marked featured, else first in list. */
export function getFeaturedAppVideo(): AppVideo | undefined {
  return APP_VIDEOS.find((v) => v.isFeatured) ?? APP_VIDEOS[0];
}

export function getAppVideosByCategory(category: VideoCategory): AppVideo[] {
  return APP_VIDEOS.filter((v) => v.category === category);
}
