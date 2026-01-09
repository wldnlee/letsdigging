
import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const searchSongs = async (query: string): Promise<Song[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for songs related to "${query}". Include both Korean and international artists. Provide the 10 most accurate and popular matches. Sort by popularity and exact title matches first.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              year: { type: Type.STRING },
              duration: { type: Type.STRING },
              thumbnail: { type: Type.STRING, description: "Use a valid placeholder from picsum if unknown" },
              youtubeId: { type: Type.STRING },
              youtubeMusicUrl: { type: Type.STRING }
            },
            required: ["title", "artist", "album"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((s: any, idx: number) => ({
      ...s,
      id: s.id || `search-${idx}-${Date.now()}`,
      thumbnail: s.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(s.title)}/300/300`,
      youtubeMusicUrl: s.youtubeMusicUrl || `https://music.youtube.com/search?q=${encodeURIComponent(s.title + ' ' + s.artist)}`
    }));
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
};

export const getRecommendations = async (song: Song): Promise<Song[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend 10 songs similar to "${song.title}" by "${song.artist}". Provide diverse suggestions but maintain the same vibe.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              year: { type: Type.STRING },
              duration: { type: Type.STRING },
              thumbnail: { type: Type.STRING },
              youtubeId: { type: Type.STRING },
              youtubeMusicUrl: { type: Type.STRING }
            },
            required: ["title", "artist", "album"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((s: any, idx: number) => ({
      ...s,
      id: s.id || `rec-${idx}-${Date.now()}`,
      thumbnail: s.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(s.title)}/300/300`,
      youtubeMusicUrl: s.youtubeMusicUrl || `https://music.youtube.com/search?q=${encodeURIComponent(s.title + ' ' + s.artist)}`
    }));
  } catch (error) {
    console.error("Recommendations failed:", error);
    return [];
  }
};

export const getRandomKoreanMV = async (): Promise<Song> => {
  try {
    // We favor KPOP but include indies, etc.
    const genres = ["K-Pop", "Korean Indie", "K-Drama OST", "Korean Singer-Songwriter"];
    const randomGenre = genres[Math.floor(Math.random() * (Math.random() > 0.6 ? 1 : genres.length))];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Pick one random, high-quality Korean music video from ${randomGenre}. It must have a valid YouTube official video.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            album: { type: Type.STRING },
            year: { type: Type.STRING },
            youtubeId: { type: Type.STRING },
            youtubeMusicUrl: { type: Type.STRING },
            thumbnail: { type: Type.STRING }
          },
          required: ["title", "artist", "youtubeId"]
        }
      }
    });

    const s = JSON.parse(response.text || "{}");
    return {
      ...s,
      id: s.id || `rand-${Date.now()}`,
      thumbnail: s.thumbnail || `https://img.youtube.com/vi/${s.youtubeId}/maxresdefault.jpg`,
      youtubeMusicUrl: s.youtubeMusicUrl || `https://music.youtube.com/search?q=${encodeURIComponent(s.title + ' ' + s.artist)}`
    };
  } catch (error) {
    // Fallback if API fails or rate limited
    const fallbackId = "f6YDKF0LVWw";
    return {
      id: 'fallback',
      title: 'OMG',
      artist: 'NewJeans',
      album: 'OMG',
      youtubeId: fallbackId,
      thumbnail: `https://img.youtube.com/vi/${fallbackId}/maxresdefault.jpg`,
      youtubeMusicUrl: 'https://music.youtube.com/search?q=NewJeans%20OMG'
    };
  }
};
