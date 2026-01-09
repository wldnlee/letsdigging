
import React, { useState, useEffect, useCallback } from 'react';
import { Song, ViewState } from './types';
import { Icons, POINT_COLOR } from './constants';
import { getRandomKoreanMV, searchSongs, getRecommendations } from './geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [mainMV, setMainMV] = useState<Song | null>(null);
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('saved_songs');
    if (saved) setSavedSongs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('saved_songs', JSON.stringify(savedSongs));
  }, [savedSongs]);

  // Initial Load
  useEffect(() => {
    fetchMainMV();
  }, []);

  const fetchMainMV = async () => {
    setIsLoading(true);
    const mv = await getRandomKoreanMV();
    setMainMV(mv);
    setIsLoading(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setView('search');
    const results = await searchSongs(searchQuery);
    setSearchResults(results);
    setIsLoading(false);
  };

  const handleSelectSong = async (song: Song) => {
    setSelectedSong(song);
    setView('detail');
    setIsLoading(true);
    const recs = await getRecommendations(song);
    setRecommendations(recs);
    setIsLoading(false);
  };

  const handleToggleSave = (song: Song) => {
    const isSaved = savedSongs.some(s => s.title === song.title && s.artist === song.artist);
    if (isSaved) {
      setSavedSongs(prev => prev.filter(s => !(s.title === song.title && s.artist === song.artist)));
    } else {
      setSavedSongs(prev => [...prev, song]);
    }
  };

  const handleRefreshRecommendations = async () => {
    if (!selectedSong) return;
    setIsLoading(true);
    const recs = await getRecommendations(selectedSong);
    setRecommendations(recs);
    setIsLoading(false);
  };

  const isSongSaved = (song: Song) => {
    return savedSongs.some(s => s.title === song.title && s.artist === song.artist);
  };

  const copyToClipboard = async (song: Song) => {
    try {
      await navigator.clipboard.writeText(`${song.title} - ${song.artist}`);
      alert('복사되었습니다: ' + song.title + ' - ' + song.artist);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Menu Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-6">
        <div 
          className="text-2xl font-bold cursor-pointer tracking-tighter"
          onClick={() => { setView('main'); setSearchQuery(''); }}
        >
          K-PULSE
        </div>
        <div className="flex gap-6 items-center">
          <button 
            onClick={() => setView('saved')}
            className={`text-sm font-medium hover:text-[#9Ccee9] transition-colors ${view === 'saved' ? 'text-[#9Ccee9]' : ''}`}
          >
            My Library ({savedSongs.length})
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
        {/* Search Bar - Always visible */}
        <div className="w-full">
          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, albums..."
              className="w-full h-14 pl-14 pr-6 bg-gray-50/50 border border-gray-200 rounded-3xl outline-none focus:border-[#9Ccee9] transition-all text-lg font-light shadow-sm group-hover:shadow-md"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#9Ccee9]">
              <Icons.Search />
            </div>
          </form>
        </div>

        {/* View Switcher */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className="animate-spin text-[#9Ccee9]">
              <Icons.Refresh />
            </div>
            <p className="text-gray-400 font-light animate-pulse">디깅 중...</p>
          </div>
        ) : (
          <div className="flex-1">
            {view === 'main' && mainMV && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    Today's Choice
                  </h2>
                  <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video bg-black relative group">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${mainMV.youtubeId}?autoplay=0&rel=0`}
                      title={mainMV.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-4 px-2">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold line-clamp-1">{mainMV.title}</h3>
                    <p className="text-gray-500 font-medium">{mainMV.artist}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <a 
                      href={mainMV.youtubeMusicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-[#9Ccee9]/10 text-[#9Ccee9] rounded-full hover:bg-[#9Ccee9] hover:text-white transition-all transform hover:scale-110"
                    >
                      <Icons.Play />
                    </a>
                    <button 
                      onClick={() => handleToggleSave(mainMV)}
                      className="p-3 transition-transform active:scale-90"
                    >
                      <Icons.Plus color={isSongSaved(mainMV) ? POINT_COLOR : '#E5E7EB'} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {view === 'search' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setView('main')} className="text-gray-400 hover:text-black">
                    <Icons.Back />
                  </button>
                  <h2 className="text-xl font-bold">Search Results</h2>
                </div>
                {searchResults.map((song) => (
                  <div 
                    key={song.id}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                    onClick={() => handleSelectSong(song)}
                  >
                    <img src={song.thumbnail} alt={song.title} className="w-16 h-16 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-lg">{song.title}</div>
                      <div className="text-gray-500 text-sm flex items-center gap-2">
                        {song.artist} • {song.album} {song.duration && `• ${song.duration}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'detail' && selectedSong && (
              <div className="animate-fadeIn space-y-12 pb-20">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="w-full md:w-64 aspect-square">
                    <img src={selectedSong.thumbnail} alt={selectedSong.title} className="w-full h-full rounded-2xl object-cover shadow-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-4xl font-extrabold mb-2 leading-tight">{selectedSong.title}</h2>
                        <h3 className="text-2xl text-gray-500 font-medium mb-4">{selectedSong.artist}</h3>
                        <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                          {selectedSong.album} {selectedSong.year && `• ${selectedSong.year}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a 
                          href={selectedSong.youtubeMusicUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-4 bg-[#9Ccee9]/20 text-[#9Ccee9] rounded-2xl hover:bg-[#9Ccee9] hover:text-white transition-all"
                        >
                          <Icons.Music color="currentColor" />
                        </a>
                        <button 
                          onClick={() => handleToggleSave(selectedSong)}
                          className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
                        >
                          <Icons.Plus color={isSongSaved(selectedSong) ? POINT_COLOR : '#cbd5e1'} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold tracking-tight">Recommended for you</h3>
                    <button 
                      onClick={handleRefreshRecommendations}
                      className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#9Ccee9] transition-colors"
                    >
                      <Icons.Refresh /> Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {recommendations.map((song) => (
                      <div 
                        key={song.id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group"
                      >
                        <img 
                          src={song.thumbnail} 
                          alt={song.title} 
                          className="w-14 h-14 rounded-xl object-cover"
                          onClick={() => handleSelectSong(song)}
                        />
                        <div className="flex-1 min-w-0" onClick={() => handleSelectSong(song)}>
                          <div className="font-bold truncate group-hover:text-[#9Ccee9] transition-colors">{song.title}</div>
                          <div className="text-gray-400 text-sm truncate">{song.artist}</div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={song.youtubeMusicUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-gray-300 hover:text-[#9Ccee9]"
                          >
                            <Icons.Play />
                          </a>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleSave(song); }}
                            className="p-2"
                          >
                            <Icons.Plus color={isSongSaved(song) ? POINT_COLOR : '#cbd5e1'} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === 'saved' && (
              <div className="animate-fadeIn space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">My Library</h2>
                  <p className="text-sm text-gray-400">항목을 누르면 제목이 복사됩니다</p>
                </div>
                {savedSongs.length === 0 ? (
                  <div className="py-20 text-center text-gray-300">
                    <div className="mb-4 flex justify-center"><Icons.Music /></div>
                    저장된 노래가 없습니다. 디깅을 시작해보세요!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSongs.map((song) => (
                      <div 
                        key={song.id}
                        className="flex items-center gap-4 p-4 border border-gray-50 hover:border-[#9Ccee9]/30 hover:bg-[#9Ccee9]/5 rounded-2xl transition-all group"
                      >
                        <img 
                          src={song.thumbnail} 
                          alt={song.title} 
                          className="w-16 h-16 rounded-xl object-cover shadow-sm"
                          onClick={() => copyToClipboard(song)}
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => copyToClipboard(song)}>
                          <div className="font-bold truncate text-lg">{song.title}</div>
                          <div className="text-gray-500 text-sm truncate">{song.artist}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <a 
                            href={song.youtubeMusicUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 text-gray-300 hover:text-[#9Ccee9] transition-colors"
                          >
                            <Icons.Play />
                          </a>
                          <button 
                            onClick={() => handleToggleSave(song)}
                            className="p-3 text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <Icons.Delete />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Decoration */}
      <footer className="py-8 text-center text-gray-300 text-xs font-light">
        © 2024 K-PULSE Music Digging Service. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
