export type PhotosResponse = {
  readonly id: string;
  readonly author: string;
  readonly width: number;
  readonly height: number;
  readonly download_url: string;
  // this is unsplash url not photo path
  readonly url: string;

}