"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Navigation, ArrowRight, Building2, Users, ShieldCheck, Star, Home as HomeIcon, Heart, CalendarCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { POPULAR_AREAS, type MessSummary } from "@/lib/types";
import { MessCard } from "@/components/mess-card";
import { Badge } from "@/components/ui/badge";

export function HomePage() {
  const { setView, setSearchCenter, setFilters } = useAppStore();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState<MessSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messes?featured=true")
      .then((r) => r.json())
      .then((d) => setFeatured(d.messes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const match = POPULAR_AREAS.find((a) => a.name.includes(query) || query.includes(a.name));
    if (match) {
      setSearchCenter({ lat: match.lat, lng: match.lng, label: match.name });
      setFilters({ area: match.name });
    } else if (query) {
      setFilters({ area: query });
    }
    setView("search");
  };

  const handleAreaClick = (area: { name: string; lat: number; lng: number }) => {
    setSearchCenter({ lat: area.lat, lng: area.lng, label: area.name });
    setFilters({ area: area.name });
    setView("search");
  };

  return (
    <div className="animate-fade-in-up">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-emerald-50 to-background dark:from-primary/20 dark:via-emerald-950/30 dark:to-background" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, oklch(0.69 0.15 165) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <MapPin className="h-3 w-3 mr-1" /> বাংলাদেশের #১ মেস সার্চ প্ল্যাটফর্ম
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              আপনার এলাকায় খুঁজে নিন
              <br />
              <span className="text-primary">সেরা মেস ও হোস্টেল</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              ম্যাপে রিয়েল-টাইম সিট অ্যাভেইলেবিলিটি দেখুন, ফিল্টার করুন বাজেট ও ফ্যাসিলিটি অনুযায়ী,
              এবং সরাসরি বুকিং রিকোয়েস্ট পাঠান — সব এক জায়গায়।
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="এলাকা বা ইউনিভার্সিটি লিখুন (যেমন: মিরপুর, শাহবাগ)"
                  className="pl-10 h-12 text-base shadow-sm"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6">
                <Search className="h-4 w-4 mr-2" /> মেস খুঁজুন
              </Button>
            </form>

            <div className="mt-3">
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setFilters({ useLocation: true });
                  setView("search");
                }}
                className="text-primary"
              >
                <Navigation className="h-3.5 w-3.5 mr-1" /> বর্তমান লোকেশন ব্যবহার করুন
              </Button>
            </div>

            {/* Popular areas */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-muted-foreground self-center mr-1">জনপ্রিয় এলাকা:</span>
              {POPULAR_AREAS.slice(0, 6).map((a) => (
                <button
                  key={a.name}
                  onClick={() => handleAreaClick(a)}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs font-medium hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <MapPin className="h-3 w-3 text-primary" /> {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Building2, label: "লিস্টেড মেস", value: "১২০+" },
            { icon: Users, label: "সক্রিয় সিকার", value: "৫,০০০+" },
            { icon: ShieldCheck, label: "ভেরিফায়েড মালিক", value: "৮৫+" },
            { icon: CalendarCheck, label: "সফল বুকিং", value: "২,৩০০+" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">কীভাবে কাজ করে</h2>
          <p className="text-muted-foreground">৩ ধাপেই আপনার পছন্দের মেস বুক করুন</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Search, step: "১", title: "খুঁজুন", desc: "ম্যাপে এলাকা সিলেক্ট করে বাজেট ও ফ্যাসিলিটি অনুযায়ী মেস ফিল্টার করুন।" },
            { icon: Star, step: "২", title: "দেখুন", desc: "লাইভ সিট চার্ট দেখে কোন সিট ফাঁকা তা জানুন ও মেসের বিস্তারিত যাচাই করুন।" },
            { icon: CalendarCheck, step: "৩", title: "বুক করুন", desc: "পছন্দের সিট সিলেক্ট করে বুকিং রিকোয়েস্ট পাঠান, মালিক অনুমোদন দিলেই কনফার্ম।" },
          ].map((s, i) => (
            <Card key={s.title} className="relative p-6">
              <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {s.step}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              {i < 2 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-secondary/30 border-y">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">ফিচার্ড ও ভেরিফায়েড মেস</h2>
              <p className="text-muted-foreground">এডমিন যাচাইকৃত সেরা মেসসমূহ</p>
            </div>
            <Button variant="outline" onClick={() => setView("search")} className="hidden sm:inline-flex">
              সব মেস দেখুন <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.slice(0, 4).map((m) => (
                <MessCard key={m.id} mess={m} />
              ))}
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" onClick={() => setView("search")}>
              সব মেস দেখুন <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* OWNER CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
          <CardContent className="p-8 md:p-12 relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative grid md:grid-cols-2 gap-6 items-center">
              <div>
                <Badge className="bg-white/20 text-white border-0 mb-3">মেস মালিকদের জন্য</Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  আপনার মেস লিস্ট করুন, সম্পূর্ণ বিনামূল্যে
                </h2>
                <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                  একটি ড্যাশবোর্ড থেকে মেস, রুম, সিট ও বুকিং রিকোয়েস্ট পরিচালনা করুন।
                  আয়ের হিসাব, টেন্যান্ট ম্যানেজমেন্ট ও রিভিউ — সব এক জায়গায়।
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => useAppStore.getState().openAuth("signup", "OWNER")}
                  >
                    <Building2 className="h-4 w-4 mr-2" /> মেস মালিক হিসেবে যোগ দিন
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => setView("how-it-works")}
                  >
                    বিস্তারিত জানুন
                  </Button>
                </div>
              </div>
              <div className="hidden md:grid grid-cols-2 gap-3">
                {[
                  { icon: Building2, label: "মাল্টি-মেস সাপোর্ট" },
                  { icon: Users, label: "টেন্যান্ট ম্যানেজমেন্ট" },
                  { icon: CalendarCheck, label: "রিকোয়েস্ট ইনবক্স" },
                  { icon: Heart, label: "আয়ের রিপোর্ট" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 backdrop-blur">
                    <f.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
