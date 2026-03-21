/** GET/PUT /api/vision-board */

export type VisionBoardRead = {
  vision_statement: string;
  intentions: [string, string, string];
  image_url: string | null;
  quote: string | null;
};

export type VisionBoardUpdate = {
  vision_statement: string;
  intentions: string[];
  image_url: string | null;
  quote: string | null;
};
