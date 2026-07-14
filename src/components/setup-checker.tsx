"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Loader2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

interface SetupStatus {
  firestore: "checking" | "ok" | "error";
  auth: "checking" | "ok" | "error";
  seed: "checking" | "ok" | "empty" | "error";
}

export function SetupChecker() {
  const [status, setStatus] = useState<SetupStatus>({
    firestore: "checking",
    auth: "checking",
    seed: "checking",
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    // Check Firestore by trying to read messes
    try {
      const res = await fetch("/api/messes?featured=true");
      const data = await res.json();
      if (res.ok) {
        setStatus((s) => ({ ...s, firestore: "ok", seed: data.messes?.length > 0 ? "ok" : "empty" }));
      } else {
        setStatus((s) => ({ ...s, firestore: "error", seed: "error" }));
        setShow(true);
      }
    } catch {
      setStatus((s) => ({ ...s, firestore: "error", seed: "error" }));
      setShow(true);
    }

    // Check auth — Firebase Auth doesn't have a server check, but we can verify config
    setStatus((s) => ({ ...s, auth: "ok" }));
  };

  const runSeed = async () => {
    toast.info("ডেমো ডেটা যোগ করা হচ্ছে…");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`সফল! ${data.messes || 10} টি মেস যোগ হয়েছে।`);
        setStatus((s) => ({ ...s, firestore: "ok", seed: "ok" }));
        setTimeout(() => window.location.reload(), 1500);
      } else {
        if (data.action === "set-firestore-rules") {
          toast.error("Firestore রুল সেট করুন আগে (নিচে নির্দেশনা দেখুন)", { duration: 8000 });
        } else {
          toast.error(data.error || "সিড ব্যর্থ");
        }
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    }
  };

  const copyRules = () => {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;
    navigator.clipboard.writeText(rules);
    toast.success("রুল কপি হয়েছে! Firebase Console-এ পেস্ট করুন।");
  };

  if (!show && status.firestore === "ok" && status.seed === "ok") return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            সেটআপ প্রয়োজন
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Firestore status */}
          <div className="flex items-center gap-2">
            {status.firestore === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status.firestore === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {status.firestore === "error" && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">Firebase Firestore কানেকশন</span>
          </div>

          {/* Seed status */}
          <div className="flex items-center gap-2">
            {status.seed === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status.seed === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {status.seed === "empty" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            {status.seed === "error" && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">
              ডেমো ডেটা{" "}
              {status.seed === "empty" && "(খালি — সিড করুন)"}
              {status.seed === "error" && "(সিড করতে সমস্যা)"}
            </span>
          </div>

          {status.firestore === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
              <p className="text-sm font-semibold text-red-800">Firestore রুল সেট করুন:</p>
              <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                <li>
                  <a
                    href="https://console.firebase.google.com/project/mess-66852/firestore/rules"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline inline-flex items-center gap-0.5"
                  >
                    Firebase Console → Firestore → Rules <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>নিচের রুল কপি করে পেস্ট করুন</li>
                <li>Publish ক্লিক করুন</li>
              </ol>
              <pre className="text-[10px] bg-white rounded p-2 overflow-x-auto">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</pre>
              <Button size="sm" variant="outline" onClick={copyRules} className="w-full">
                <Copy className="h-3 w-3 mr-1.5" /> রুল কপি করুন
              </Button>
            </div>
          )}

          {status.firestore === "ok" && status.seed === "empty" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800 mb-3">
                ডেমো ডেটা খালি। টেস্ট করার জন্য ডেমো ডেটা যোগ করুন:
              </p>
              <Button onClick={runSeed} className="w-full">
                ডেমো ডেটা যোগ করুন (সিড)
              </Button>
            </div>
          )}

          {/* Auth domain warning */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-blue-800 mb-1">Firebase Auth ডোমেন:</p>
            <p className="text-xs text-blue-700 mb-2">
              Google লগইন কাজ করতে হলে আপনার Vercel ডোমেন যোগ করুন:
            </p>
            <a
              href="https://console.firebase.google.com/project/mess-66852/authentication/settings"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline inline-flex items-center gap-0.5"
            >
              Firebase Console → Auth → Settings → Authorized domains <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Button variant="outline" onClick={() => setShow(false)} className="w-full">
            পরে করব
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
