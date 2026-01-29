export type MediaType = "audio" | "video";
export type MergeMode = "copy" | "reencode";

export type FileSetting = {
  start: number;
  end: number;
  fadeIn: number;
  fadeOut: number;
};
