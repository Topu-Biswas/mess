"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Send, MessageCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ContactView() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("সব ঘর পূরণ করুন");
      return;
    }
    toast.success("আপনার বার্তা পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।");
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">যোগাযোগ করুন</h1>
        <p className="text-muted-foreground">প্রশ্ন, সাজেশন বা সমস্যা হলে আমাদের জানান।</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">ফোন</div>
                <div className="font-semibold text-sm">+৮৮০ ৯৬১২-৩৪৫৬৭৮</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">ইমেইল</div>
                <div className="font-semibold text-sm">support@messfinder.bd</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">ঠিকানা</div>
                <div className="font-semibold text-sm">ধানমন্ডি, ঢাকা-১২০৫</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">সাপোর্ট সময়</div>
                <div className="font-semibold text-sm">প্রতিদিন ৯টা – ৯টা</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-bold mb-4">বার্তা পাঠান</h2>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-name">নাম</Label>
                    <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-phone">ফোন</Label>
                    <Input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-msg">বার্তা</Label>
                  <Textarea
                    id="c-msg"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    placeholder="আপনার প্রশ্ন বা সমস্যা লিখুন…"
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" /> বার্তা পাঠান
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-2" /> ইমেইল
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
