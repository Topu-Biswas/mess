"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, CalendarCheck, MapPin, Building2, ShieldCheck, Users, ArrowRight, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function HowItWorksView() {
  const { setView, openAuth } = useAppStore();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 animate-fade-in-up">
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-3">গাইড</Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">যেভাবে কাজ করে</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          মেস ফাইন্ডার দিয়ে মাত্র ৩ ধাপে আপনার পছন্দের মেস খুঁজে বুক করুন — অথবা মালিক হিসেবে নিজের মেস লিস্ট করুন।
        </p>
      </div>

      {/* Seeker flow */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> সিকারদের জন্য
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Search, title: "১. ম্যাপে খুঁজুন", desc: "এলাকা লিখুন বা কারেন্ট লোকেশন ব্যবহার করুন। বাজেট, দূরত্ব, ফ্যাসিলিটি ও মেস টাইপ অনুযায়ী ফিল্টার করুন। ম্যাপে রিয়েল-টাইমে রঙ-কোডেড পিন দেখুন।" },
            { icon: Eye, title: "২. সিট চার্ট দেখুন", desc: "পিনে ক্লিক করে মেসের বিস্তারিত দেখুন। রেলওয়ে সিট চার্টের মতো প্রতিটি সিটের লাইভ স্ট্যাটাস — ফাঁকা, পেন্ডিং, বুকড — এক নজরে।" },
            { icon: CalendarCheck, title: "৩. বুকিং রিকোয়েস্ট", desc: "পছন্দের ফাঁকা সিট সিলেক্ট করে মুভ-ইন ডেট ও মেসেজসহ রিকোয়েস্ট পাঠান। সিট ১৫-৩০ মিনিট হোল্ড থাকবে। মালিক অনুমোদন দিলেই কনফার্ম।" },
          ].map((s) => (
            <Card key={s.title}>
              <CardContent className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-5">
          <Button size="lg" onClick={() => setView("search")}>
            <Search className="h-4 w-4 mr-2" /> এখনই মেস খুঁজুন
          </Button>
        </div>
      </section>

      {/* Owner flow */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> মেস মালিকদের জন্য
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, title: "সাইনআপ + যাচাই", desc: "NID/লাইসেন্স আপলোড করে সাইনআপ করুন। এডমিন যাচাই করে অনুমোদন দেবেন।" },
            { icon: MapPin, title: "মেস লিস্ট করুন", desc: "ঠিকানা, ম্যাপ পিন, ছবি ও ফ্যাসিলিটি যোগ করে মেস লিস্ট করুন। মাল্টি-মেস সাপোর্ট।" },
            { icon: Building2, title: "রুম ও সিট", desc: "রুম যোগ করে প্রতিটিতে সিট ও ভাড়া সেট করুন। বাল্ক অ্যাকশনে একসাথে অনেক সিট যোগ করুন।" },
            { icon: CalendarCheck, title: "রিকোয়েস্ট ম্যানেজ", desc: "ইনবক্সে আসা রিকোয়েস্ট Approve/Reject করুন। টেন্যান্ট, আয় ও রিভিউ এক জায়গায়।" },
          ].map((s) => (
            <Card key={s.title}>
              <CardContent className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-5">
          <Button size="lg" variant="outline" onClick={() => openAuth("signup", "OWNER")}>
            <Building2 className="h-4 w-4 mr-2" /> মেস মালিক হিসেবে যোগ দিন
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-bold mb-4">সাধারণ প্রশ্ন</h2>
        <div className="space-y-2">
          {[
            { q: "ব্রাউজ করতে কি লগইন লাগে?", a: "না। ম্যাপ ব্রাউজ, ফিল্টার ও মেস ডিটেইলস দেখা লগইন ছাড়াই সম্ভব। শুধু বুকিং রিকোয়েস্ট বা মালিকের নম্বর দেখতে লগইন প্রয়োজন।" },
            { q: "একই সিট দুজন বুক করলে কী হবে?", a: "যে আগে রিকোয়েস্ট সাবমিট করবেন সিটটি তার জন্য ১৫-৩০ মিনিট হোল্ড হবে। অন্যজনকে 'এই সিটটি এইমাত্র হোল্ড হয়ে গেছে' বার্তা দেখানো হবে।" },
            { q: "মালিক সাড়া না দিলে?", a: "৪৮ ঘণ্টা পর সিকারকে 'অন্য মেস দেখুন' সাজেশন দেওয়া হয় এবং এডমিনকে ফ্ল্যাগ করা হয়।" },
            { q: "ভুয়া মেস বা মালিক হলে?", a: "প্রতিটি মেসে 'রিপোর্ট করুন' বাটন আছে। মালিকদের NID/লাইসেন্স যাচাই বাধ্যতামূলক। এডমিন সাসপেন্ড বা রিমুভ করতে পারেন।" },
            { q: "পেমেন্ট কীভাবে হয়?", a: "বর্তমানে অগ্রিম লেনদেন মালিক-সিকার সরাসরি করেন। ভবিষ্যতে পেমেন্ট গেটওয়ে যোগ হবে।" },
          ].map((f, i) => (
            <details key={i} className="group rounded-lg border p-4 cursor-pointer">
              <summary className="font-semibold text-sm flex items-center justify-between list-none">
                {f.q}
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="text-center mt-10">
        <Button variant="link" onClick={() => setView("home")}>
          হোমপেজে ফিরুন <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
