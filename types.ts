
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: string;
  duration?: string;
  thumbnail: string;
  youtubeId?: string;
  youtubeMusicUrl: string;
}

export type ViewState = 'main' | 'search' | 'detail' | 'saved';

export interface SearchResult {
  songs: Song[];
}
