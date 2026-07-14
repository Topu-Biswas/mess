// Firestore seed script — populates demo data using batch writes (fast)
// Run: bun run seed or POST /api/seed
import {
  adminDb,
  Timestamp,
  clearAllData,
  serverTimestamp,
} from "@/lib/firestore-db";
import { collection, doc, writeBatch } from "firebase/firestore";

const MESS_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
];
const AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
];

interface MessSeed {
  name: string; area: string; address: string; lat: number; lng: number;
  type: string; rentFrom: number; rentTo: number; rating: number; reviewCount: number;
  verified: boolean; featured: boolean; description: string; facilities: string[];
  images: string[]; roomCount: number; seatsPerRoom: number[];
}

const MESSES: MessSeed[] = [
  { name: "আল-মাদিনা ছাত্র মেস", area: "মিরপুর", address: "হাউজ ১২, রোড ৪, মিরপুর-১২, ঢাকা", lat: 23.8068, lng: 90.3686, type: "STUDENT_MALE", rentFrom: 3500, rentTo: 6000, rating: 4.5, reviewCount: 38, verified: true, featured: true, description: "মিরপুর ১২ এর প্রাণকেন্দ্রে অবস্থিত একটি পরিচ্ছন্ন ও নিরাপদ ছাত্র মেস।", facilities: ["wifi","attached_bath","gas","cctv","ips","study_table","filtered_water"], images: [MESS_IMAGES[0],MESS_IMAGES[2],MESS_IMAGES[5]], roomCount: 6, seatsPerRoom: [3,3,2,3,4,2] },
  { name: "গ্রিন ভিউ ছাত্রী মেস", area: "ধানমন্ডি", address: "হাউজ ২৩, রোড ৭, ধানমন্ডি, ঢাকা", lat: 23.7461, lng: 90.3742, type: "STUDENT_FEMALE", rentFrom: 4500, rentTo: 7500, rating: 4.7, reviewCount: 52, verified: true, featured: true, description: "ধানমন্ডি লেকের পাশে নিরাপদ ও শান্ত পরিবেশে ছাত্রীদের জন্য আদর্শ মেস।", facilities: ["wifi","attached_bath","ac","gas","laundry","cctv","ips","furnished","study_table","filtered_water","lift"], images: [MESS_IMAGES[1],MESS_IMAGES[4],MESS_IMAGES[6]], roomCount: 5, seatsPerRoom: [2,3,2,3,2] },
  { name: "নূর ফ্যামিলি রেসিডেন্স", area: "মোহাম্মদপুর", address: "হাউজ ৫, ব্লক সি, মোহাম্মদপুর, ঢাকা", lat: 23.7657, lng: 90.3585, type: "FAMILY", rentFrom: 8000, rentTo: 15000, rating: 4.3, reviewCount: 21, verified: true, featured: false, description: "ছোট পরিবারের জন্য স্বতন্ত্র রুমসহ পরিচ্ছন্ন আবাসিক মেস।", facilities: ["wifi","attached_bath","ac","gas","cctv","ips","furnished","lift"], images: [MESS_IMAGES[2],MESS_IMAGES[5],MESS_IMAGES[7]], roomCount: 4, seatsPerRoom: [1,1,2,1] },
  { name: "শাহবাগ স্টুডেন্ট হোস্টেল", area: "শাহবাগ", address: "রোড ৩, শাহবাগ, ঢাকা-১০০০", lat: 23.7333, lng: 90.3929, type: "STUDENT_MALE", rentFrom: 4000, rentTo: 6500, rating: 4.1, reviewCount: 29, verified: true, featured: true, description: "ঢাকা বিশ্ববিদ্যালয় ও বাংলা কলেজের নিকটে অবস্থিত।", facilities: ["wifi","attached_bath","gas","cctv","ips","study_table","filtered_water","laundry"], images: [MESS_IMAGES[3],MESS_IMAGES[0],MESS_IMAGES[6]], roomCount: 7, seatsPerRoom: [4,4,3,3,4,2,3] },
  { name: "ফার্মগেট গার্লস মেস", area: "ফার্মগেট", address: "হাউজ ১৮, ফার্মগেট, ঢাকা", lat: 23.7536, lng: 90.3933, type: "STUDENT_FEMALE", rentFrom: 5000, rentTo: 8000, rating: 4.6, reviewCount: 44, verified: true, featured: false, description: "ফার্মগেট মেট্রো স্টেশনের কাছে অবস্থিত নিরাপদ ছাত্রী মেস।", facilities: ["wifi","attached_bath","ac","gas","laundry","cctv","ips","furnished","filtered_water","lift"], images: [MESS_IMAGES[4],MESS_IMAGES[1],MESS_IMAGES[5]], roomCount: 5, seatsPerRoom: [2,3,2,2,3] },
  { name: "বনানী প্রিমিয়াম মেস", area: "বনানী", address: "রোড ১১, বনানী, ঢাকা", lat: 23.7937, lng: 90.4066, type: "STUDENT_MALE", rentFrom: 6000, rentTo: 10000, rating: 4.8, reviewCount: 67, verified: true, featured: true, description: "বনানী কূলাল চত্বরের কাছে প্রিমিয়াম মেস।", facilities: ["wifi","attached_bath","ac","gas","laundry","cctv","ips","furnished","study_table","filtered_water","lift"], images: [MESS_IMAGES[5],MESS_IMAGES[2],MESS_IMAGES[0]], roomCount: 6, seatsPerRoom: [2,2,3,2,2,3] },
  { name: "উত্তরা সিটি মেস", area: "উত্তরা", address: "সেক্টর ৭, উত্তরা, ঢাকা", lat: 23.8728, lng: 90.3984, type: "FAMILY", rentFrom: 9000, rentTo: 16000, rating: 4.2, reviewCount: 18, verified: false, featured: false, description: "উত্তরা সেক্টর ৭ এ পরিবারের জন্য পরিচ্ছন্ন মেস।", facilities: ["wifi","attached_bath","gas","cctv","ips","lift"], images: [MESS_IMAGES[6],MESS_IMAGES[7],MESS_IMAGES[3]], roomCount: 4, seatsPerRoom: [1,2,1,2] },
  { name: "গুলশান ইন্টারন্যাশনাল হোস্টেল", area: "গুলশান", address: "গুলশান-১, রোড ৪১, ঢাকা", lat: 23.7806, lng: 90.4193, type: "STUDENT_FEMALE", rentFrom: 7000, rentTo: 12000, rating: 4.9, reviewCount: 81, verified: true, featured: true, description: "গুলশানের প্রিমিয়াম এলাকায় আন্তর্জাতিক মানের হোস্টেল।", facilities: ["wifi","attached_bath","ac","gas","laundry","cctv","ips","furnished","study_table","filtered_water","lift"], images: [MESS_IMAGES[7],MESS_IMAGES[4],MESS_IMAGES[1]], roomCount: 6, seatsPerRoom: [2,2,2,3,2,2] },
  { name: "মিরপুর ইস্ট স্টুডেন্ট মেস", area: "মিরপুর", address: "রোড ২, মিরপুর-১০, ঢাকা", lat: 23.8128, lng: 90.3556, type: "STUDENT_MALE", rentFrom: 3000, rentTo: 5000, rating: 3.9, reviewCount: 15, verified: false, featured: false, description: "সাশ্রয়ী মূল্যে ছাত্রদের জন্য মেস।", facilities: ["wifi","gas","ips","filtered_water"], images: [MESS_IMAGES[0],MESS_IMAGES[6]], roomCount: 5, seatsPerRoom: [4,4,3,4,3] },
  { name: "ধানমন্ডি লেক ভিউ মেস", area: "ধানমন্ডি", address: "রোড ২৭, ধানমন্ডি, ঢাকা", lat: 23.7411, lng: 90.3702, type: "STUDENT_MALE", rentFrom: 5500, rentTo: 8500, rating: 4.4, reviewCount: 33, verified: true, featured: false, description: "ধানমন্ডি লেকের দৃশ্যসহ মেস।", facilities: ["wifi","attached_bath","ac","gas","laundry","cctv","ips","study_table","filtered_water"], images: [MESS_IMAGES[2],MESS_IMAGES[5],MESS_IMAGES[0]], roomCount: 5, seatsPerRoom: [2,3,2,3,2] },
];

const SEEKER_NAMES = ["রাফিউল ইসলাম","তানভীর আহমেদ","সাদিয়া আক্তার","মেহেদী হাসান","ফারহানা ইসলাম","আবদুল্লাহ আল মামুন","নুসরাত জাহান","শাকিল খান"];

function pickStatus(i: number): "AVAILABLE" | "PENDING" | "BOOKED" | "MAINTENANCE" {
  const cycle = i % 7;
  if (cycle === 0 || cycle === 3) return "BOOKED";
  if (cycle === 1) return "PENDING";
  if (cycle === 5) return "MAINTENANCE";
  return "AVAILABLE";
}

export async function seedFirestore() {
  console.log("Clearing existing data...");
  await clearAllData();

  // Use a single large batch for all writes (Firestore max 500 per batch)
  let batch = writeBatch(adminDb);
  let batchCount = 0;
  const commitBatch = async () => {
    if (batchCount > 0) {
      await batch.commit();
      batch = writeBatch(adminDb);
      batchCount = 0;
    }
  };

  // Helper to add to batch
  const addToBatch = (colName: string, data: any) => {
    const ref = doc(collection(adminDb, colName));
    batch.set(ref, { ...data, id: ref.id });
    batchCount++;
    return ref.id;
  };

  // Create users
  console.log("Creating users...");
  const adminId = addToBatch("users", { name: "সাইট এডমিন", email: "admin@messfinder.bd", phone: "01700000000", photoURL: AVATARS[0], role: "ADMIN", status: "ACTIVE", commissionRate: 0, preferredAreas: null, createdAt: serverTimestamp() });
  const owner1Id = addToBatch("users", { name: "মোঃ রহিম উদ্দিন", email: "rahim@messfinder.bd", phone: "01711111111", photoURL: AVATARS[2], role: "OWNER", status: "ACTIVE", commissionRate: 5.0, preferredAreas: null, createdAt: serverTimestamp() });
  const owner2Id = addToBatch("users", { name: "মোছাঃ সালমা বেগম", email: "salma@messfinder.bd", phone: "01722222222", photoURL: AVATARS[1], role: "OWNER", status: "ACTIVE", commissionRate: 5.0, preferredAreas: null, createdAt: serverTimestamp() });
  addToBatch("users", { name: "তৌফিক এলাহী", email: "toufiq@messfinder.bd", phone: "01733333333", photoURL: AVATARS[3], role: "OWNER", status: "PENDING", commissionRate: 5.0, preferredAreas: null, createdAt: serverTimestamp() });

  const seekerIds: string[] = [];
  for (let i = 0; i < SEEKER_NAMES.length; i++) {
    const sid = addToBatch("users", { name: SEEKER_NAMES[i], email: `seeker${i}@messfinder.bd`, phone: `0180000000${i}`, photoURL: AVATARS[i % AVATARS.length], role: "SEEKER", status: "ACTIVE", commissionRate: 0, preferredAreas: ["মিরপুর","ধানমন্ডি"][i % 2], createdAt: serverTimestamp() });
    seekerIds.push(sid);
  }
  await commitBatch();

  // Create messes + rooms + seats
  console.log("Creating messes...");
  const ownerIds = [owner1Id, owner2Id, owner1Id, owner2Id, owner1Id, owner2Id, owner1Id, owner2Id, owner1Id, owner2Id];
  const messData: { id: string; name: string; area: string; rentFrom: number; rentTo: number }[] = [];
  let bookingCount = 0;
  const bookingsToCreate: { bookingId: string; seatId: string; messId: string; seekerId: string; seatRent: number; moveInDate: Date; durationMonths: number }[] = [];

  for (let mi = 0; mi < MESSES.length; mi++) {
    const m = MESSES[mi];
    const ownerId = ownerIds[mi];
    const messId = addToBatch("messes", {
      name: m.name, description: m.description, address: m.address, area: m.area, city: "ঢাকা",
      lat: m.lat, lng: m.lng, type: m.type, rentFrom: m.rentFrom, rentTo: m.rentTo,
      ownerId, verified: m.verified, published: true, featured: m.featured,
      images: m.images, facilities: m.facilities, rating: m.rating, reviewCount: m.reviewCount,
      reported: false, reportReason: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    messData.push({ id: messId, name: m.name, area: m.area, rentFrom: m.rentFrom, rentTo: m.rentTo });

    // Rooms and seats
    let seatIdx = 0;
    let totalSeats = 0;
    let availableSeats = 0;
    const seatIds: { id: string; rent: number; status: string; number: string }[] = [];
    for (let ri = 0; ri < m.roomCount; ri++) {
      const roomNumber = `${100 + ri + 1}`;
      const roomId = addToBatch("rooms", { number: roomNumber, messId });
      const seatCount = m.seatsPerRoom[ri] ?? 3;
      for (let si = 0; si < seatCount; si++) {
        const status = pickStatus(seatIdx);
        const rent = m.rentFrom + ((seatIdx * 250) % Math.max(1, m.rentTo - m.rentFrom));
        const seatId = addToBatch("seats", {
          number: `${roomNumber}-${String.fromCharCode(65 + si)}`,
          roomId, messId, rent, type: seatCount <= 2 ? "SINGLE" : "SHARED", status,
        });
        seatIds.push({ id: seatId, rent, status, number: `${roomNumber}-${String.fromCharCode(65 + si)}` });
        totalSeats++;
        if (status === "AVAILABLE") availableSeats++;
        seatIdx++;
      }
    }
    // Update mess with seat counts (in same batch)
    batch.update(doc(adminDb, "messes", messId), { totalSeats, availableSeats: availableSeats });
    batchCount++;

    // Create confirmed bookings for BOOKED seats
    const bookedSeats = seatIds.filter((s) => s.status === "BOOKED");
    for (let si = 0; si < Math.min(bookedSeats.length, 5); si++) {
      const seat = bookedSeats[si];
      const seekerId = seekerIds[(mi + si) % seekerIds.length];
      const moveInMonthsAgo = 1 + (si % 6);
      const moveInDate = new Date();
      moveInDate.setMonth(moveInDate.getMonth() - moveInMonthsAgo);
      moveInDate.setDate(1);
      const durationMonths = 12;
      const ref = `MF-2026-${4513 + bookingCount}`;
      bookingCount++;
      const bookingId = addToBatch("bookings", {
        reference: ref, seatId: seat.id, messId, seekerId,
        moveInDate: Timestamp.fromDate(moveInDate), duration: `${durationMonths} মাস`, durationMonths,
        message: "", status: "CONFIRMED", rejectReason: null,
        agreedRent: seat.rent, securityDeposit: seat.rent * 2, checkOutDate: null,
        createdAt: serverTimestamp(),
      });
      bookingsToCreate.push({ bookingId, seatId: seat.id, messId, seekerId, seatRent: seat.rent, moveInDate, durationMonths });
    }

    // Reviews
    const reviewCount = Math.min(3, Math.floor(m.reviewCount / 12));
    for (let r = 0; r < reviewCount; r++) {
      const seekerId = seekerIds[(mi + r) % seekerIds.length];
      addToBatch("reviews", {
        messId, userId: seekerId, userName: SEEKER_NAMES[(mi + r) % SEEKER_NAMES.length],
        rating: Math.round(m.rating),
        comment: ["খুবই পরিচ্ছন্ন ও নিরাপদ মেস। মালিক সহযোগিতাশীল।","পরিবেশ ভালো, তবে পানির সমস্যা ছিল।","ভাড়ার তুলনায় সুবিধা ভালো।"][r % 3],
        ownerReply: r % 2 === 0 ? "ধন্যবাদ আপনার মতামতের জন্য।" : null,
        createdAt: serverTimestamp(),
      });
    }

    // Commit batch every 400 operations (Firestore max 500)
    if (batchCount >= 400) {
      await commitBatch();
      console.log(`  Progress: mess ${mi + 1}/${MESSES.length}`);
    }
  }
  await commitBatch();

  // Create payments and expenses
  console.log("Creating payments and expenses...");
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const PAYMENT_METHODS = ["CASH", "BKASH", "NAGAD", "BANK"];
  const EXPENSE_CATS = [
    { cat: "UTILITY", desc: "বিদ্যুৎ বিল", base: 3500 },
    { cat: "UTILITY", desc: "পানি বিল", base: 800 },
    { cat: "UTILITY", desc: "ইন্টারনেট বিল", base: 1500 },
    { cat: "SALARY", desc: "কেয়ারটেকার বেতন", base: 8000 },
    { cat: "CLEANING", desc: "পরিচ্ছন্নতা খরচ", base: 2000 },
    { cat: "SECURITY", desc: "নিরাপত্তা গার্ড", base: 6000 },
  ];

  for (const { bookingId, messId, seekerId, seatRent, moveInDate } of bookingsToCreate) {
    // Monthly rent payments
    let iter = new Date(moveInDate.getFullYear(), moveInDate.getMonth(), 1);
    let monthCount = 0;
    while (iter <= now && monthCount < 12) {
      const monthKey = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, "0")}`;
      const dueDate = new Date(iter.getFullYear(), iter.getMonth(), 5);
      const isPast = dueDate < now;
      const isCurrent = monthKey === currentMonthKey;
      const rand = (bookingId.charCodeAt(bookingId.length - 1) + monthCount) % 20;
      let status: "DUE" | "PAID" | "OVERDUE" = "DUE";
      let paidDate: Date | null = null;
      let method: string | null = null;
      if (isPast) {
        if (rand < 16) { status = "PAID"; paidDate = new Date(dueDate.getTime() - (rand % 3) * 86400000); method = PAYMENT_METHODS[rand % PAYMENT_METHODS.length]; }
        else { status = "OVERDUE"; }
      } else if (isCurrent) {
        if (rand < 8) { status = "PAID"; paidDate = new Date(now.getTime() - (rand % 5) * 86400000); method = PAYMENT_METHODS[rand % PAYMENT_METHODS.length]; }
        else { status = "DUE"; }
      } else { status = "PAID"; paidDate = dueDate; method = PAYMENT_METHODS[rand % PAYMENT_METHODS.length]; }
      addToBatch("payments", {
        bookingId, seekerId, messId, amount: seatRent, type: "RENT", month: monthKey,
        dueDate: Timestamp.fromDate(dueDate), paidDate: paidDate ? Timestamp.fromDate(paidDate) : null,
        status, method, reference: method ? `${method}-${monthKey}-${bookingId.slice(-4)}` : null, note: null,
      });
      iter.setMonth(iter.getMonth() + 1);
      monthCount++;
    }
    // Security deposit
    addToBatch("payments", {
      bookingId, seekerId, messId, amount: seatRent * 2, type: "DEPOSIT",
      month: `${moveInDate.getFullYear()}-${String(moveInDate.getMonth() + 1).padStart(2, "0")}`,
      dueDate: Timestamp.fromDate(moveInDate), paidDate: Timestamp.fromDate(moveInDate), status: "PAID",
      method: PAYMENT_METHODS[bookingId.charCodeAt(bookingId.length - 1) % PAYMENT_METHODS.length],
      reference: `DEP-${bookingId.slice(-4)}`, note: "সিকিউরিটি ডিপোজিট (২ মাসের ভাড়া)",
    });

    // Commit if batch is full
    if (batchCount >= 400) {
      await commitBatch();
    }
  }

  // Expenses
  for (const mess of messData) {
    for (let mOff = 2; mOff >= 0; mOff--) {
      const expDate = new Date(now.getFullYear(), now.getMonth() - mOff, 10);
      for (const exp of EXPENSE_CATS) {
        const variance = 0.85 + (mess.name.charCodeAt(0) % 30) / 100;
        addToBatch("expenses", {
          messId: mess.id, ownerId: ownerIds[0], category: exp.cat,
          amount: Math.round(exp.base * variance), description: exp.desc,
          date: Timestamp.fromDate(expDate), recurring: true,
        });
      }
    }
    if (batchCount >= 400) {
      await commitBatch();
    }
  }
  await commitBatch();

  return {
    admin: adminId, owners: ownerIds.length, seekers: seekerIds.length,
    messes: MESSES.length, bookings: bookingCount,
  };
}
