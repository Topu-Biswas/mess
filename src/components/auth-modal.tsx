"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, User, Building2, ShieldCheck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const { authOpen, authMode, authRole, closeAuth, openAuth, setUser } = useAppStore();
  const [role, setRole] = useState<"SEEKER" | "OWNER">(authRole);
  const [mode, setMode] = useState<"login" | "signup">(authMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", password: "" });

  // sync when reopened
  const handleOpenChange = (open: boolean) => {
    if (!open) closeAuth();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: form.phone, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "লগইন ব্যর্থ");
        setUser(data.user);
        toast.success(`স্বাগতম, ${data.user.name}!`);
        closeAuth();
      } else {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, phone: form.phone, password: form.password, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "সাইনআপ ব্যর্থ");
        setUser(data.user);
        toast.success(
          role === "OWNER"
            ? "সাইনআপ সফল! এডমিন অনুমোদনের পর ড্যাশবোর্ড অ্যাক্সেস পাবেন।"
            : `স্বাগতম, ${data.user.name}!`
        );
        closeAuth();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "কিছু ভুল হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      toast.success(`ডেমো অ্যাকাউন্ট: ${data.user.name}`);
      closeAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ডেমো লগইন ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={authOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {mode === "login" ? "লগইন করুন" : "অ্যাকাউন্ট তৈরি করুন"}
          </DialogTitle>
          <DialogDescription className="text-center">
            বুকিং ও মালিকের সাথে যোগাযোগের জন্য লগইন প্রয়োজন
          </DialogDescription>
        </DialogHeader>

        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("SEEKER")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
                role === "SEEKER" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">সিকার</span>
              <span className="text-[10px] text-muted-foreground text-center">মেস খুঁজবেন</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("OWNER")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
                role === "OWNER" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">মেস মালিক</span>
              <span className="text-[10px] text-muted-foreground text-center">মেস লিস্ট করবেন</span>
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">পুরো নাম</Label>
              <Input
                id="auth-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="আপনার নাম"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="auth-phone">ফোন নম্বর</Label>
            <Input
              id="auth-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-pass">পাসওয়ার্ড</Label>
            <Input
              id="auth-pass"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === "signup" && role === "OWNER" && (
            <div className="rounded-lg border border-dashed p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                ভেরিফিকেশন ডকুমেন্ট
              </div>
              <p className="text-xs text-muted-foreground">
                মালিক অ্যাকাউন্টের জন্য NID বা ট্রেড লাইসেন্স আপলোড করতে হবে। এডমিন যাচাই করে অনুমোদন দেবেন।
              </p>
              <Button type="button" variant="outline" size="sm" className="w-full">
                <Upload className="h-4 w-4 mr-2" /> ডকুমেন্ট আপলোড করুন
              </Button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "login" ? "লগইন করুন" : "সাইনআপ করুন"}
          </Button>
        </form>

        <div className="text-center text-sm">
          {mode === "login" ? (
            <>
              অ্যাকাউন্ট নেই?{" "}
              <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">
                সাইনআপ করুন
              </button>
            </>
          ) : (
            <>
              অ্যাকাউন্ট আছে?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                লগইন করুন
              </button>
            </>
          )}
        </div>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">ডেমো অ্যাকাউন্ট</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => quickLogin("01800000000", "seeker123")} disabled={loading}>
            সিকার
          </Button>
          <Button variant="outline" size="sm" onClick={() => quickLogin("01711111111", "owner123")} disabled={loading}>
            মালিক
          </Button>
          <Button variant="outline" size="sm" onClick={() => quickLogin("01700000000", "admin123")} disabled={loading}>
            এডমিন
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
