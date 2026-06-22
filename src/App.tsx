import { useEffect, useState, useRef, MouseEvent, FormEvent } from "react";
import { AnimatePresence } from "motion/react";
import { 
  Tv, Search, Radio, ChevronLeft, ChevronRight, 
  Heart, SlidersHorizontal, RefreshCw, AlertCircle, Info, Flame 
} from "lucide-react";
import Header from "./components/Header";
import Splash from "./components/Splash";
import VideoPlayer from "./components/VideoPlayer";
import ChannelCard from "./components/ChannelCard";
import CategoryFilter from "./components/CategoryFilter";
import FeaturedBanner from "./components/FeaturedBanner";
import { TVChannel, Category, Pagination } from "./types";

const FIFA_CHANNEL: TVChannel = {
  id: "fifa-live",
  name: "FIFA Live Stream (Featured)",
  category: "Sports",
  logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=200&auto=format&fit=crop",
  url: "https://customer-d2wx6hg0y7zyfsis.cloudflarestream.com/a919aca8e8fadded8ba82cbbb3c43b04/manifest/video.m3u8"
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [channels, setChannels] = useState<TVChannel[]>([FIFA_CHANNEL]);
  const [categories, setCategories] = useState<Category[]>([
    { name: "Sports", count: 1 },
    { name: "News", count: 4 },
    { name: "Science & Tech", count: 1 }
  ]);
  const [activeChannel, setActiveChannel] = useState<TVChannel>(FIFA_CHANNEL);
  
  // Filtering & Pagination state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>(""); // state for submitted query
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 1,
    page: 1,
    limit: 30,
    totalPages: 1
  });

  // Local storage lists
  const [favorites, setFavorites] = useState<TVChannel[]>(() => {
    try {
      const saved = localStorage.getItem("dzt_tv_favorites_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Status & loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendRefreshing, setIsBackendRefreshing] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState({
    status: "ok",
    channelsLoaded: 8,
    isFetching: false
  });

  const channelsListRef = useRef<HTMLDivElement>(null);

  // Sync favorites with localStorage
  useEffect(() => {
    localStorage.setItem("dzt_tv_favorites_v2", JSON.stringify(favorites));
  }, [favorites]);

  // Handle addition/removal of favorites
  const handleToggleFavorite = (e: MouseEvent, channel: TVChannel) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.some(c => c.id === channel.id || c.url === channel.url);
      if (isFav) {
        return prev.filter(c => c.url !== channel.url);
      } else {
        return [...prev, channel];
      }
    });
  };

  // Fetch categories metadata
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCategories(data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch server categories:", e);
    }
  };

  // Fetch servers state on interval
  const fetchServerHealth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          status: data.status,
          channelsLoaded: data.channelsLoaded,
          isFetching: data.isFetching
        });
      }
    } catch (e) {
      console.warn("Could not query server health status:", e);
    }
  };

  // Main channels listing parser
  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      if (showFavoritesOnly) {
        // filter favorite streams locally
        let filtered = [...favorites];
        if (searchQuery) {
          filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        const limit = 30;
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const offset = (currentPage - 1) * limit;
        const paginated = filtered.slice(offset, offset + limit);

        setChannels(paginated);
        setPagination({
          total,
          page: currentPage,
          limit,
          totalPages
        });
        setIsLoading(false);
        return;
      }

      // API fetch logic
      const url = `/api/channels?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}&page=${currentPage}&limit=32`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Stream compilation failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling Server health & status counts
  useEffect(() => {
    fetchServerHealth();
    const interval = setInterval(fetchServerHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync category listings
  useEffect(() => {
    fetchCategories();
  }, [serverStatus.channelsLoaded]);

  // Main effects hook for trigger updates
  useEffect(() => {
    fetchChannels();
  }, [selectedCategory, searchQuery, currentPage, showFavoritesOnly, favorites.length]);

  // Search Submit handle
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchText);
    setCurrentPage(1); // Reset page on new search
  };

  // Reset entire search filter configurations
  const handleResetFilters = () => {
    setSearchText("");
    setSearchQuery("");
    setSelectedCategory("");
    setShowFavoritesOnly(false);
    setCurrentPage(1);
  };

  // Handle background re-indexing
  const handleBackgroundRefresh = async () => {
    setIsBackendRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      setTimeout(async () => {
        await fetchServerHealth();
        await fetchCategories();
        await fetchChannels();
        setIsBackendRefreshing(false);
      }, 3000);
    } catch (e) {
      console.warn("Re-index triggering error:", e);
      setIsBackendRefreshing(false);
    }
  };

  // Action for play featured live stream shortcut
  const handlePlayFeatured = () => {
    setActiveChannel(FIFA_CHANNEL);
    // Smooth scroll back to player viewport
    const viewport = document.getElementById("video-player-root");
    if (viewport) {
      viewport.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex flex-col font-sans">
      
      {/* Visual background element animations */}
      <AnimatePresence>
        {showSplash && <Splash onDismiss={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* Styled top navigation bar */}
      <Header 
        totalChannels={serverStatus.channelsLoaded} 
        isBackendRefreshing={isBackendRefreshing}
        onRefreshBackend={handleBackgroundRefresh}
        serverStatus={serverStatus}
      />

      {/* Primary Application Layout container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">
        
        {/* Double-span Cinema & Billboard structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Video play Stage (Left, large layout span) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <VideoPlayer channel={activeChannel} />
            
            {/* Stream detailed panel */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 flex justify-between items-center text-xs flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-slate-400 font-medium">Currently broadcasting:</span>
                <span className="font-bold text-white uppercase">{activeChannel.name}</span>
              </div>
              <div className="flex gap-2 font-mono text-[11px] text-slate-500">
                <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {activeChannel.category}
                </span>
                <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 hidden sm:inline-block">
                  No-CORS Proxy active
                </span>
              </div>
            </div>
          </div>

          {/* Quick info right side (Right, single span) */}
          <div className="flex flex-col gap-4 h-full">
            {/* Short channel description card */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-5 rounded-2xl border border-slate-900/80 backdrop-blur-sm shadow-xl flex flex-col justify-between flex-1 min-h-[160px]">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400">
                    Welcome to DZt TV
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">Your Digital Live Stadium</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans mb-3">
                  Say goodbye to region restrictions. Browse, bookmark, and stream live sports, global news channels, and educational media in one single visual interface. All streams are updated dynamically.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-900 text-[10.5px] font-mono text-[#475569] flex justify-between">
                <span>Save favorites locally</span>
                <span>Fast stream loading</span>
              </div>
            </div>

            {/* Visual Featured match indicator banner */}
            <div className="bg-gradient-to-tr from-[#020617] to-slate-950 p-4 rounded-2xl border border-slate-900 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-900 flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono font-extrabold text-blue-400 uppercase tracking-widest block mb-0.5">FIFA Stream</span>
                  <p className="text-xs text-white truncate font-semibold leading-tight">Featured Soccer Match Live</p>
                </div>
              </div>
              <button
                onClick={handlePlayFeatured}
                className="px-3.5 py-1.5 rounded-full bg-blue-600/90 hover:bg-blue-500 hover:scale-105 active:scale-95 duration-150 text-[11px] font-bold text-white cursor-pointer"
              >
                Watch
              </button>
            </div>
          </div>

        </div>

        {/* Featured Big Banner Billboard Row */}
        <FeaturedBanner onPlayFeatured={handlePlayFeatured} channel={FIFA_CHANNEL} />

        {/* Channels directory section header */}
        <div ref={channelsListRef} className="border-t border-slate-900 pt-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-500" />
                Browse Channels
              </h2>
              <p className="text-xs text-slate-500 font-mono tracking-wide mt-1 uppercase">
                Find what is broadcasting live worldwide right now
              </p>
            </div>

            {/* Channels Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex max-w-md w-full items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search stream names, genres..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 focus:border-blue-500/50 outline-none rounded-full py-2.5 pl-10 pr-4 text-sm font-medium transition-colors placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white tracking-wide transition-all shadow-lg active:scale-95 cursor-pointer duration-150"
              >
                Search
              </button>
            </form>
          </div>

          {/* Filtering Pill Bar */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setCurrentPage(1); // Reset page on category change
            }}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={(enabled) => {
              setShowFavoritesOnly(enabled);
              setCurrentPage(1); // Reset page
            }}
          />

          {/* Direct reset notice if filters applied */}
          {(selectedCategory || searchQuery || showFavoritesOnly) && (
            <div className="flex items-center justify-between bg-blue-950/20 py-2 px-4 rounded-xl border border-blue-900/30 text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span>
                  Showing streams filtered by: 
                  <strong className="text-white ml-1">
                    {showFavoritesOnly ? "Favorites " : ""}
                    {selectedCategory ? `${selectedCategory} ` : ""}
                    {searchQuery ? `"${searchQuery}"` : ""}
                  </strong>
                </span>
              </div>
              <button
                onClick={handleResetFilters}
                className="font-semibold text-white hover:underline cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Channels Grid Segment */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500/60 animate-spin" />
              </div>
              <p className="text-xs font-mono tracking-wider animate-pulse uppercase">
                Compiling channel directories...
              </p>
            </div>
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
              <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Broadcast Channels Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                We couldn't compile any streams matching your current filters or query. Try refining your keywords, navigating different categories, or reloading the index playlist.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-xs font-semibold text-blue-400 transition-all active:scale-95 duration-150 cursor-pointer"
              >
                Reset Dashboard Directory
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {channels.map((chan) => (
                <ChannelCard
                  key={chan.id + '-' + chan.url}
                  channel={chan}
                  isSelected={activeChannel.url === chan.url}
                  onSelect={(ch) => {
                    setActiveChannel(ch);
                    // Smooth scroll to top of viewport
                    const viewport = document.getElementById("video-player-root");
                    if (viewport) {
                      viewport.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  isFavorite={favorites.some(f => f.url === chan.url)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Pagination Drawer */}
          {pagination.totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-between border-t border-slate-900 pt-6 select-none">
              <p className="text-xs text-slate-500 font-mono">
                Showing index page <strong className="text-slate-300">{pagination.page}</strong> of <strong className="text-slate-300">{pagination.totalPages}</strong> (Total <strong className="text-slate-300">{pagination.total}</strong> channels)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    channelsListRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    currentPage === 1
                      ? "border-slate-900 text-slate-700 cursor-not-allowed"
                      : "border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 active:scale-95"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1));
                    channelsListRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage === pagination.totalPages}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    currentPage === pagination.totalPages
                      ? "border-slate-900 text-slate-700 cursor-not-allowed"
                      : "border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 active:scale-95"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Humble, literal footer context line */}
      <footer className="border-t border-slate-900/60 bg-slate-950/40 py-6 mt-16 text-center select-none">
        <p className="text-xs text-slate-600 font-mono tracking-wide">
          DZt Tv • Broadcaster stream aggregator compiled via Node 22 Cloud Server
        </p>
      </footer>
    </div>
  );
}
