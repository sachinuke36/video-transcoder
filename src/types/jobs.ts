export interface UploadJob {
  videoId: string;
  filePath: string;
  filename: string;
}


export interface TranscodeJob {
  videoId: string;
  filePath: string;
}

export interface ThumbnailJob {
  videoId: string;
  videoPath: string;
}


export interface MetadataJob {
  videoId: string;
  videoPath: string;
}
