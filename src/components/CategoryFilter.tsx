import { Radio, Heart, Award, Shield, Library } from "lucide-react";
import { Category } from "../types";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: (enabled: boolean) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  showFavoritesOnly,
  onToggleFavoritesOnly
}: CategoryFilterProps) {
  
  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "news":
        return <Award className="w-3.5 h-3.5" />;
      case "sports":
        return <Award className="w-3.5 h-3.5 text-orange-400" />;
      case "general":
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Library className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div id="category-filter-root" className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth">
      {/* Favorites Toggle Pill */}
      <button
        onClick={() => {
          onToggleFavoritesOnly(!showFavoritesOnly);
          if (!showFavoritesOnly) onSelectCategory(""); // reset other category filters if favorites clicked
        }}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
          showFavoritesOnly
            ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
            : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-white" : ""}`} />
        <span>My Saved Channels</span>
      </button>

      {/* All Categories Pill */}
      <button
        onClick={() => {
          onToggleFavoritesOnly(false);
          onSelectCategory("");
        }}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
          !showFavoritesOnly && selectedCategory === ""
            ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
        }`}
      >
        <Radio className="w-3.5 h-3.5" />
        <span>All Streams</span>
      </button>

      {/* Dynamic Categories List inside playlist */}
      {categories
        .filter(cat => cat.name && cat.name.toLowerCase() !== "undefined")
        .slice(0, 16) // Top 16 categories
        .map((cat) => {
          const isSelected = !showFavoritesOnly && selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => {
                onToggleFavoritesOnly(false);
                onSelectCategory(cat.name);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              {getIcon(cat.name)}
              <span className="capitalize">{cat.name}</span>
              <span className={`text-[10px] font-mono px-1.5 rounded-full ${
                isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-950 text-slate-500"
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
    </div>
  );
}
