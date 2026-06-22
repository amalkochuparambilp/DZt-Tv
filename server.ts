import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface TVChannel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
}

const app = express();
const PORT = 3000;

// Curated high-quality, stable channels including user-requested FIFA live link
const DEFAULT_CHANNELS: TVChannel[] = [
  {
    id: "fifa-live",
    name: "FIFA Live Stream (Featured)",
    category: "Sports",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=200&auto=format&fit=crop",
    url: "https://customer-d2wx6hg0y7zyfsis.cloudflarestream.com/a919aca8e8fadded8ba82cbbb3c43b04/manifest/video.m3u8"
  },
  {
    id: "nasa-tv",
    name: "NASA TV",
    category: "Science & Tech",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
    url: "https://ntv1.akamaized.net/hls/live/2012170/NASA-NTV1-HLS/master.m3u8"
  },
  {
    id: "al-jazeera-en",
    name: "Al Jazeera English",
    category: "News",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Al_Jazeera_English_logo.svg",
    url: "https://live-aljazeera.akamaized.net/hls/live/2005077/aje/index.m3u8"
  },
  {
    id: "dw-news-en",
    name: "DW News English",
    category: "News",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Deutsche_Welle_logo.svg",
    url: "https://dwstream72-lh.akamaihd.net/i/dwstream72_1@119253/master.m3u8"
  },
  {
    id: "france24-en",
    name: "France 24 English",
    category: "News",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/France_24_logo.svg",
    url: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8"
  },
  {
    id: "redbull-tv",
    name: "Red Bull TV",
    category: "Sports",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/ed/Red_Bull_Media_House_logo.svg",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/sports1/master.m3u8"
  },
  {
    id: "sky-news-world",
    name: "Sky News",
    category: "News",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Sky-News-Logo.svg",
    url: "https://world.skynews.com/hls/skynews_world.m3u8"
  },
  {
    id: "bloomberg-tv",
    name: "Bloomberg TV",
    category: "Business",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Bloomberg_Businessweek_Logo.svg",
    url: "https://live-bloomberg-uk.akamaized.net/live/bloomberg_tablet.m3u8"
  }
];

let cachedChannels: TVChannel[] = [...DEFAULT_CHANNELS];
let isFetching = false;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache duration

// Background fetch and parsing function
async function loadIPTVChannels() {
  if (isFetching) return;
  const now = Date.now();
  if (cachedChannels.length > DEFAULT_CHANNELS.length && now - lastFetchTime < CACHE_DURATION) {
    return;
  }

  isFetching = true;
  console.log("Background fetching IPTV channel list...");
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    const response = await fetch("https://iptv-org.github.io/iptv/index.m3u", {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.split("\n");
    const channels: TVChannel[] = [];
    
    let currentChannel: Partial<TVChannel> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (line.startsWith("#EXTINF:")) {
        const tvgId = line.match(/tvg-id="([^"]*)"/)?.[1] || "";
        const tvgName = line.match(/tvg-name="([^"]*)"/)?.[1] || "";
        const tvgLogo = line.match(/tvg-logo="([^"]*)"/)?.[1] || "";
        let groupTitle = line.match(/group-title="([^"]*)"/)?.[1] || "General";
        
        // Clean categories
        if (groupTitle.toLowerCase() === "undefined" || !groupTitle) {
          groupTitle = "General";
        }
        
        const commaIndex = line.lastIndexOf(",");
        let name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : "";
        if (!name) name = tvgName || tvgId || "Unknown Channel";
        
        currentChannel = {
          id: tvgId || `chan-${channels.length + 1}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          logo: tvgLogo,
          category: groupTitle,
        };
      } else if (line.startsWith("http") && currentChannel) {
        currentChannel.url = line;
        
        // basic stream URL validation: filter out dead formats, we focus on HLS (.m3u8) streams
        if (line.includes(".m3u8") || line.includes(".mp4") || line.includes("/manifest")) {
          channels.push(currentChannel as TVChannel);
        }
        currentChannel = null;
      }
    }
    
    if (channels.length > 0) {
      // Remove duplicates by stream URL or id
      const seenUrls = new Set<string>();
      const uniqueChannels: TVChannel[] = [];
      
      // Keep default channels at the top
      DEFAULT_CHANNELS.forEach(c => {
        seenUrls.add(c.url);
        uniqueChannels.push(c);
      });
      
      channels.forEach(c => {
        if (!seenUrls.has(c.url)) {
          seenUrls.add(c.url);
          uniqueChannels.push(c);
        }
      });
      
      cachedChannels = uniqueChannels;
      lastFetchTime = Date.now();
      console.log(`Successfully completed IPTV load. Loaded ${cachedChannels.length} total unique channels.`);
    }
  } catch (error) {
    console.warn("Could not fetch IPTV playlist, using curated/cached elements instead:", error);
  } finally {
    isFetching = false;
  }
}

// Start prefetching in background
loadIPTVChannels();

// Express middleware
app.use(express.json());

// API health and status check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    channelsLoaded: cachedChannels.length,
    isFetching,
    lastFetchTime: new Date(lastFetchTime).toISOString()
  });
});

// Force refresh list
app.post("/api/refresh", async (req, res) => {
  if (isFetching) {
    return res.status(409).json({ message: "Refresh already in progress" });
  }
  // Reset cache duration and reload
  lastFetchTime = 0;
  loadIPTVChannels();
  res.json({ message: "Refresh initiated in background" });
});

// Get TV Categories list
app.get("/api/categories", (req, res) => {
  const categoriesMap = new Map<string, number>();
  
  cachedChannels.forEach(c => {
    const cat = c.category || "General";
    categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + 1);
  });
  
  const sortedCategories = Array.from(categoriesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
    
  res.json(sortedCategories);
});

// Get TV Channels with search, category filtering, and pagination
app.get("/api/channels", (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.toLowerCase() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 40;
  
  let filtered = [...cachedChannels];
  
  // Apply category filter
  if (category) {
    filtered = filtered.filter(c => c.category === category);
  }
  
  // Apply text search
  if (query) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.category.toLowerCase().includes(query)
    );
  }
  
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);
  
  res.json({
    channels: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  });
});

// Serve frontend web routes
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DZt Tv fullstack server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
