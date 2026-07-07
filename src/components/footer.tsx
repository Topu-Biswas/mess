"use client";

import { MapPin, Facebook, Mail, Phone, Send } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { AppView } from "@/lib/types";

export function Footer() {
  const setView = useAppStore((s) => s.setView);
  const go = (v: AppView) => setView(v);
  return (
    <footer className="mt-auto border-t bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="font-bold">মেস ফাইন্ডার</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              বাংলাদেশের প্রথম ম্যাপ-বেসড মেস ও হোস্টেল খোঁজার প্ল্যাটফর্ম। এলাকাভিত্তিক লাইভ সিট অ্যাভেইলেবিলিটি ও সরাসরি বুকিং সুবিধা।
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">প্ল্যাটফর্ম</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => go("search")} className="hover:text-primary">মেস খুঁজুন</button></li>
              <li><button onClick={() => go("how-it-works")} className="hover:text-primary">যেভাবে কাজ করে</button></li>
              <li><button onClick={() => go("contact")} className="hover:text-primary">যোগাযোগ</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">মালিকদের জন্য</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => go("owner-dashboard")} className="hover:text-primary">মেস লিস্ট করুন</button></li>
              <li><button onClick={() => go("owner-dashboard")} className="hover:text-primary">মালিক ড্যাশবোর্ড</button></li>
              <li><button onClick={() => go("how-it-works")} className="hover:text-primary">যাচাইকরণ প্রক্রিয়া</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">যোগাযোগ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +৮৮০ ৯৬১২-৩৪৫৬৭৮</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@messfinder.bd</li>
              <li className="flex items-center gap-2 pt-2">
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Telegram">
                  <Send className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© ২০২৬ মেস ফাইন্ডার। সর্বস্বত্ব সংরক্ষিত।</span>
          <div className="flex items-center gap-4">
            <button className="hover:text-primary">গোপনীয়তা নীতি</button>
            <button className="hover:text-primary">শর্তাবলী</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
