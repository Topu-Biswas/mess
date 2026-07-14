"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Navigation, List, Map as MapIcon, SlidersHorizontal, X, ChevronRight, Layers, Crosshair, Check,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { FACILITIES, MESS_TYPE_LABELS, POPULAR_AREAS, type Filters, type MessSummary, type MessType } from "@/lib/types";
import { MessCard } from "@/components/mess-card";
import { formatTaka } from "@/components/ui-bits";
import { FacilityIcon } from "@/components/facility-icon";
import { MessGraphic } from "@/components/mess-graphic";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      <div className="text-sm text-muted-foreground">ম্যাপ লোড হচ্ছে…</div>
    </div>
  ),
});

export function SearchView() {
  const {
    filters, setFilters, resetFilters, searchCenter, setSearchCenter,
    hoveredMessId, setHoveredMessId, selectedMapMessId, setSelectedMapMessId,
    listView, setListView, openMess,
  } = useAppStore();

  const [messes, setMesses] = useState<MessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [satellite, setSatellite] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [pickMode, setPickMode] = useState(false);

  const fetchMesses = (f: Filters) => {
    setLoading(true);
    const params = new URLSearchParams({
      budgetMin: String(f.budgetMin),
      budgetMax: String(f.budgetMax),
      radiusKm: f.useLocation && f.userLat ? String(f.radiusKm) : (f.area ? String(f.radiusKm) : "0"),
      types: f.types.join(","),
      facilities: f.facilities.join(","),
      onlyAvailable: String(f.onlyAvailable),
      minRating: String(f.minRating),
      area: f.area,
      useLocation: String(f.useLocation),
      userLat: f.userLat ? String(f.userLat) : "",
      userLng: f.userLng ? String(f.userLng) : "",
    });
    fetch(`/api/messes?${params}`)
      .then((r) => r.json())
      .then((d) => setMesses(d.messes ?? []))
      .catch(() => setMesses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => fetchMesses(filters), 250);
    return () => clearTimeout(t);
     
  }, [filters.budgetMin, filters.budgetMax, filters.radiusKm, filters.types, filters.facilities, filters.onlyAvailable, filters.minRating, filters.area, filters.useLocation, filters.userLat, filters.userLng]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const match = POPULAR_AREAS.find((a) => a.name.includes(query) || query.includes(a.name));
    if (match) {
      setSearchCenter({ lat: match.lat, lng: match.lng, label: match.name });
      setFilters({ area: match.name });
    } else if (query) {
      setFilters({ area: query });
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("আপনার ব্রাউজার জিওলোকেশন সাপোর্ট করে না");
      return;
    }
    toast.info("লোকেশন আনা হচ্ছে…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSearchCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "আমার লোকেশন" });
        setFilters({ useLocation: true, userLat: pos.coords.latitude, userLng: pos.coords.longitude, area: "" });
        toast.success("আপনার ডিভাইস লোকেশন সেট হয়েছে");
      },
      () => {
        toast.error("লোকেশন পারমিশন দেওয়া হয়নি। ম্যাপে ক্লিক করে লোকেশন বসান।");
        setPickMode(true);
      }
    );
  };

  const onPickLocation = (lat: number, lng: number) => {
    type AreaWithDist = { name: string; lat: number; lng: number; d: number };
    const nearest = POPULAR_AREAS.reduce<AreaWithDist>(
      (best, a) => {
        const d = Math.hypot(a.lat - lat, a.lng - lng);
        return d < best.d ? { name: a.name, lat: a.lat, lng: a.lng, d } : best;
      },
      { name: "কাস্টম পয়েন্ট", lat: 0, lng: 0, d: Infinity }
    );
    const label = nearest.d < 0.05 ? nearest.name : "কাস্টম পয়েন্ট";
    setSearchCenter({ lat, lng, label });
    setFilters({ useLocation: true, userLat: lat, userLng: lng, area: "" });
    setPickMode(false);
    toast.success(`লোকেশন সেট হয়েছে — ${label}। এখন এই পয়েন্টের আশেপাশে মেস খুঁজুন।`);
  };

  const clearLocation = () => {
    setFilters({ useLocation: false, userLat: null, userLng: null });
    setSearchCenter(null);
    toast.info("লোকেশন মুছে ফেলা হয়েছে");
  };

  const toggleType = (t: MessType) => {
    const has = filters.types.includes(t);
    setFilters({ types: has ? filters.types.filter((x) => x !== t) : [...filters.types, t] });
  };
  const toggleFacility = (k: string) => {
    const has = filters.facilities.includes(k);
    setFilters({ facilities: has ? filters.facilities.filter((x) => x !== k) : [...filters.facilities, k] });
  };

  const FiltersPanel = (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5"><span>💰 বাজেট</span></Label>
          <span className="text-xs text-muted-foreground">
            {formatTaka(filters.budgetMin)} – {formatTaka(filters.budgetMax)}
          </span>
        </div>
        <Slider
          value={[filters.budgetMin, filters.budgetMax]}
          min={0}
          max={20000}
          step={500}
          onValueChange={([min, max]) => setFilters({ budgetMin: min, budgetMax: max })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold">📍 দূরত্ব (কিমি)</Label>
          <span className="text-xs text-muted-foreground">{filters.radiusKm} কিমি</span>
        </div>
        <Slider
          value={[filters.radiusKm]}
          min={1}
          max={20}
          step={1}
          onValueChange={([v]) => setFilters({ radiusKm: v })}
        />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">🏠 মেস টাইপ</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {(["STUDENT_MALE", "STUDENT_FEMALE", "FAMILY"] as MessType[]).map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                filters.types.includes(t) ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50"
              )}
            >
              {MESS_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">✅ ফ্যাসিলিটি</Label>
        <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto scroll-thin pr-1">
          {FACILITIES.map((f) => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.facilities.includes(f.key)}
                onCheckedChange={() => toggleFacility(f.key)}
              />
              <FacilityIcon iconKey={f.icon} className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="only-avail" className="text-sm font-semibold cursor-pointer">🟢 শুধু ফাঁকা সিট আছে</Label>
        <Switch id="only-avail" checked={filters.onlyAvailable} onCheckedChange={(v) => setFilters({ onlyAvailable: v })} />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">⭐ সর্বনিম্ন রেটিং</Label>
        <div className="flex gap-1.5 flex-wrap">
          {[0, 3, 3.5, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setFilters({ minRating: r })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                filters.minRating === r ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50"
              )}
            >
              {r === 0 ? "সব" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={resetFilters}>রিসেট</Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)]">
      {/* Top bar — mobile: compact + search prominent; desktop: full toolbar */}
      <div className="border-b bg-background/95 backdrop-blur z-20 px-3 py-2 flex items-center gap-2 shrink-0">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="এলাকা লিখুন…"
            className="pl-9 h-10 text-base"
          />
        </form>
        {/* Mobile: icon-only buttons, 44px touch targets */}
        <Button variant="outline" size="icon" onClick={useMyLocation} className="h-10 w-10 shrink-0 md:hidden" aria-label="আমার লোকেশন">
          <Navigation className="h-4 w-4" />
        </Button>
        <Button
          variant={pickMode ? "default" : "outline"}
          size="icon"
          onClick={() => {
            setPickMode(!pickMode);
            if (!pickMode) toast.info("ম্যাপে যেকোনো জায়গায় ক্লিক করে আপনার লোকেশন বসান");
          }}
          className="h-10 w-10 shrink-0 md:hidden"
          aria-label="ম্যাপে বসান"
        >
          {pickMode ? <Check className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
        </Button>
        {/* Desktop: labeled buttons */}
        <Button variant="outline" size="sm" onClick={useMyLocation} className="hidden md:inline-flex h-9">
          <Navigation className="h-3.5 w-3.5 mr-1.5" /> আমার লোকেশন
        </Button>
        <Button
          variant={pickMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setPickMode(!pickMode);
            if (!pickMode) toast.info("ম্যাপে যেকোনো জায়গায় ক্লিক করে আপনার লোকেশন বসান");
          }}
          className="hidden md:inline-flex h-9"
        >
          {pickMode ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Crosshair className="h-3.5 w-3.5 mr-1.5" />}
          {pickMode ? "সেভ" : "ম্যাপে বসান"}
        </Button>
        {filters.useLocation && (
          <Button variant="ghost" size="sm" onClick={clearLocation} className="hidden md:inline-flex h-9 text-muted-foreground">
            <X className="h-3.5 w-3.5 mr-1" /> মুছুন
          </Button>
        )}
        <div className="flex rounded-md border overflow-hidden h-9 hidden md:flex">
          <button
            onClick={() => setSatellite(false)}
            className={cn("px-3 text-xs font-medium flex items-center gap-1", !satellite ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            <MapIcon className="h-3.5 w-3.5" /> ম্যাপ
          </button>
          <button
            onClick={() => setSatellite(true)}
            className={cn("px-3 text-xs font-medium flex items-center gap-1", satellite ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            <Layers className="h-3.5 w-3.5" /> স্যাটেলাইট
          </button>
        </div>
        <Button
          variant={listView ? "outline" : "default"}
          size="sm"
          onClick={() => setListView(!listView)}
          className="h-9 shrink-0"
        >
          {listView ? <MapIcon className="h-3.5 w-3.5 md:mr-1.5" /> : <List className="h-3.5 w-3.5 md:mr-1.5" />}
          <span className="hidden md:inline">{listView ? "ম্যাপ" : "লিস্ট"}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFiltersMobile(true)}
          className="h-9 md:hidden shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </Button>
        <Badge variant="secondary" className="h-9 px-3 flex items-center gap-1 shrink-0">
          {loading ? "…" : messes.length}
          <span className="hidden sm:inline">টি মেস</span>
        </Badge>
      </div>

      <div className="flex-1 flex relative overflow-hidden min-h-0">
        {/* Desktop filters sidebar */}
        <aside className="hidden md:block w-72 lg:w-80 shrink-0 border-r bg-background overflow-y-auto scroll-thin p-4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
          </h3>
          {FiltersPanel}
        </aside>

        {/* Map area */}
        {!listView && (
          <div className="flex-1 relative min-h-0" style={{ minHeight: "300px" }}>
            <MapView
              messes={messes}
              searchCenter={searchCenter}
              radius={filters.radiusKm}
              useLocation={filters.useLocation}
              satellite={satellite}
              hoveredMessId={hoveredMessId}
              selectedMapMessId={selectedMapMessId}
              setHoveredMessId={setHoveredMessId}
              setSelectedMapMessId={setSelectedMapMessId}
              openMess={openMess}
              pickMode={pickMode}
              onPickLocation={onPickLocation}
            />

            {/* Pick mode banner */}
            {pickMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in-up">
                <Crosshair className="h-4 w-4 animate-pulse" />
                ম্যাপে যেকোনো জায়গায় ক্লিক করে আপনার লোকেশন বসান
              </div>
            )}

            {/* Current location info chip */}
            {filters.useLocation && searchCenter && !pickMode && (
              <div className="absolute top-4 left-4 z-[1000] bg-background/95 backdrop-blur border rounded-full shadow-md px-3 py-1.5 flex items-center gap-2 text-xs">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-medium">{searchCenter.label}</span>
                <span className="text-muted-foreground">• {filters.radiusKm} কিমি রেডিয়াস</span>
              </div>
            )}

            {/* Floating preview card */}
            {selectedMapMessId && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
                {(() => {
                  const m = messes.find((x) => x.id === selectedMapMessId);
                  if (!m) return null;
                  return (
                    <div className="bg-background rounded-xl shadow-xl border p-3 flex gap-3 animate-fade-in-up">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <MessGraphic type={m.type} name={m.name} className="h-full w-full" iconSize="h-6 w-6" showName={false} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm line-clamp-1">{m.name}</h4>
                          <button onClick={() => setSelectedMapMessId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3" /> {m.area}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-primary">{formatTaka(m.rentFrom)}<span className="text-[10px] text-muted-foreground font-normal">/মাস থেকে</span></span>
                          <span className="text-xs">⭐ {m.rating} ({m.reviewCount})</span>
                        </div>
                        <Button size="sm" className="w-full h-7 text-xs" onClick={() => openMess(m.id)}>
                          বিস্তারিত দেখুন <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {messes.length === 0 && !loading && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] bg-background/95 rounded-xl shadow-lg border p-6 text-center max-w-sm">
                <div className="text-3xl mb-2">🔍</div>
                <h4 className="font-bold mb-1">এই ফিল্টারে কিছু পাওয়া যায়নি</h4>
                <p className="text-xs text-muted-foreground mb-3">রেডিয়াস বাড়ান বা ফিল্টার রিসেট করে আবার চেষ্টা করুন।</p>
                <Button size="sm" variant="outline" onClick={resetFilters}>ফিল্টার রিসেট করুন</Button>
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {listView && (
          <div className="flex-1 overflow-y-auto scroll-thin p-4">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : messes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <h4 className="font-bold mb-1">কিছু পাওয়া যায়নি</h4>
                <p className="text-sm text-muted-foreground mb-4">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                <Button variant="outline" onClick={resetFilters}>ফিল্টার রিসেট করুন</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {messes.map((m) => (
                  <MessCard
                    key={m.id}
                    mess={m}
                    highlight={hoveredMessId === m.id}
                    onHover={setHoveredMessId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile filters bottom-sheet — half screen, map visible above */}
      {showFiltersMobile && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden" style={{ top: "40%" }}>
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFiltersMobile(false)} />
          <div className="relative bg-background rounded-t-2xl shadow-2xl h-full overflow-hidden flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between p-3 border-b shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
              </h3>
              <button onClick={() => setShowFiltersMobile(false)} className="p-1 rounded-md hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin p-4">
              {FiltersPanel}
            </div>
            <div className="p-3 border-t shrink-0">
              <Button className="w-full" onClick={() => setShowFiltersMobile(false)}>
                {messes.length} টি মেস দেখুন
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
