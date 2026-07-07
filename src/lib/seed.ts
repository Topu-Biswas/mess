// Database seed script for Mess Finder
// Run via: bun run db:seed (or call /api/seed)
import { db } from "@/lib/db";

const MESS_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80", // room
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80", // bedroom
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80", // modern room
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80", // hostel bunk
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80", // small room
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80", // cozy
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80", // interior
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80", // hostel
];

const AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
];

interface MessSeed {
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  type: "STUDENT_MALE" | "STUDENT_FEMALE" | "FAMILY";
  rentFrom: number;
  rentTo: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  description: string;
  facilities: string[];
  images: string[];
  roomCount: number;
  seatsPerRoom: number[];
}

const MESSES: MessSeed[] = [
  {
    name: "আল-মাদিনা ছাত্র মেস",
    area: "মিরপুর",
    address: "হাউজ ১২, রোড ৪, মিরপুর-১২, ঢাকা",
    lat: 23.8068,
    lng: 90.3686,
    type: "STUDENT_MALE",
    rentFrom: 3500,
    rentTo: 6000,
    rating: 4.5,
    reviewCount: 38,
    verified: true,
    featured: true,
    description:
      "মিরপুর ১২ এর প্রাণকেন্দ্রে অবস্থিত একটি পরিচ্ছন্ন ও নিরাপদ ছাত্র মেস। বাসস্ট্যান্ড ও মার্কেট হাঁটা দূরত্বে। সব রুমে প্রচুর আলো-বাতাস আসে।",
    facilities: ["wifi", "attached_bath", "gas", "cctv", "ips", "study_table", "filtered_water"],
    images: [MESS_IMAGES[0], MESS_IMAGES[2], MESS_IMAGES[5]],
    roomCount: 6,
    seatsPerRoom: [3, 3, 2, 3, 4, 2],
  },
  {
    name: "গ্রিন ভিউ ছাত্রী মেস",
    area: "ধানমন্ডি",
    address: "হাউজ ২৩, রোড ৭, ধানমন্ডি, ঢাকা",
    lat: 23.7461,
    lng: 90.3742,
    type: "STUDENT_FEMALE",
    rentFrom: 4500,
    rentTo: 7500,
    rating: 4.7,
    reviewCount: 52,
    verified: true,
    featured: true,
    description:
      "ধানমন্ডি লেকের পাশে নিরাপদ ও শান্ত পরিবেশে ছাত্রীদের জন্য আদর্শ মেস। ২৪/৭ সিকিউরিটি গার্ড ও ম্যাট্রন বিদ্যমান।",
    facilities: ["wifi", "attached_bath", "ac", "gas", "laundry", "cctv", "ips", "furnished", "study_table", "filtered_water", "lift"],
    images: [MESS_IMAGES[1], MESS_IMAGES[4], MESS_IMAGES[6]],
    roomCount: 5,
    seatsPerRoom: [2, 3, 2, 3, 2],
  },
  {
    name: "নূর ফ্যামিলি রেসিডেন্স",
    area: "মোহাম্মদপুর",
    address: "হাউজ ৫, ব্লক সি, মোহাম্মদপুর, ঢাকা",
    lat: 23.7657,
    lng: 90.3585,
    type: "FAMILY",
    rentFrom: 8000,
    rentTo: 15000,
    rating: 4.3,
    reviewCount: 21,
    verified: true,
    featured: false,
    description:
      "ছোট পরিবারের জন্য স্বতন্ত্র রুমসহ পরিচ্ছন্ন আবাসিক মেস। রান্নাঘর ও বাথরুম আলাদা।",
    facilities: ["wifi", "attached_bath", "ac", "gas", "cctv", "ips", "furnished", "lift"],
    images: [MESS_IMAGES[2], MESS_IMAGES[5], MESS_IMAGES[7]],
    roomCount: 4,
    seatsPerRoom: [1, 1, 2, 1],
  },
  {
    name: "শাহবাগ স্টুডেন্ট হোস্টেল",
    area: "শাহবাগ",
    address: "রোড ৩, শাহবাগ, ঢাকা-১০০০",
    lat: 23.7333,
    lng: 90.3929,
    type: "STUDENT_MALE",
    rentFrom: 4000,
    rentTo: 6500,
    rating: 4.1,
    reviewCount: 29,
    verified: true,
    featured: true,
    description:
      "ঢাকা বিশ্ববিদ্যালয় ও বাংলা কলেজের নিকটে অবস্থিত। পরীক্ষার সময় স্টাডি রুম সুবিধা।",
    facilities: ["wifi", "attached_bath", "gas", "cctv", "ips", "study_table", "filtered_water", "laundry"],
    images: [MESS_IMAGES[3], MESS_IMAGES[0], MESS_IMAGES[6]],
    roomCount: 7,
    seatsPerRoom: [4, 4, 3, 3, 4, 2, 3],
  },
  {
    name: "ফার্মগেট গার্লস মেস",
    area: "ফার্মগেট",
    address: "হাউজ ১৮, ফার্মগেট, ঢাকা",
    lat: 23.7536,
    lng: 90.3933,
    type: "STUDENT_FEMALE",
    rentFrom: 5000,
    rentTo: 8000,
    rating: 4.6,
    reviewCount: 44,
    verified: true,
    featured: false,
    description:
      "ফার্মগেট মেট্রো স্টেশনের কাছে অবস্থিত নিরাপদ ছাত্রী মেস। সকল আধুনিক সুবিধাসহ।",
    facilities: ["wifi", "attached_bath", "ac", "gas", "laundry", "cctv", "ips", "furnished", "filtered_water", "lift"],
    images: [MESS_IMAGES[4], MESS_IMAGES[1], MESS_IMAGES[5]],
    roomCount: 5,
    seatsPerRoom: [2, 3, 2, 2, 3],
  },
  {
    name: "বনানী প্রিমিয়াম মেস",
    area: "বনানী",
    address: "রোড ১১, বনানী, ঢাকা",
    lat: 23.7937,
    lng: 90.4066,
    type: "STUDENT_MALE",
    rentFrom: 6000,
    rentTo: 10000,
    rating: 4.8,
    reviewCount: 67,
    verified: true,
    featured: true,
    description:
      "বনানী কূলাল চত্বরের কাছে প্রিমিয়াম মেস। এসি, জিম, ও ছাদবাগান সুবিধা।",
    facilities: ["wifi", "attached_bath", "ac", "gas", "laundry", "cctv", "ips", "furnished", "study_table", "filtered_water", "lift"],
    images: [MESS_IMAGES[5], MESS_IMAGES[2], MESS_IMAGES[0]],
    roomCount: 6,
    seatsPerRoom: [2, 2, 3, 2, 2, 3],
  },
  {
    name: "উত্তরা সিটি মেস",
    area: "উত্তরা",
    address: "সেক্টর ৭, উত্তরা, ঢাকা",
    lat: 23.8728,
    lng: 90.3984,
    type: "FAMILY",
    rentFrom: 9000,
    rentTo: 16000,
    rating: 4.2,
    reviewCount: 18,
    verified: false,
    featured: false,
    description:
      "উত্তরা সেক্টর ৭ এ পরিবারের জন্য পরিচ্ছন্ন মেস। মেট্রো স্টেশন ৫ মিনিট দূরে।",
    facilities: ["wifi", "attached_bath", "gas", "cctv", "ips", "lift"],
    images: [MESS_IMAGES[6], MESS_IMAGES[7], MESS_IMAGES[3]],
    roomCount: 4,
    seatsPerRoom: [1, 2, 1, 2],
  },
  {
    name: "গুলশান ইন্টারন্যাশনাল হোস্টেল",
    area: "গুলশান",
    address: "গুলশান-১, রোড ৪১, ঢাকা",
    lat: 23.7806,
    lng: 90.4193,
    type: "STUDENT_FEMALE",
    rentFrom: 7000,
    rentTo: 12000,
    rating: 4.9,
    reviewCount: 81,
    verified: true,
    featured: true,
    description:
      "গুলশানের প্রিমিয়াম এলাকায় আন্তর্জাতিক মানের হোস্টেল। বিদেশি শিক্ষার্থীদের জন্য উপযুক্ত।",
    facilities: ["wifi", "attached_bath", "ac", "gas", "laundry", "cctv", "ips", "furnished", "study_table", "filtered_water", "lift"],
    images: [MESS_IMAGES[7], MESS_IMAGES[4], MESS_IMAGES[1]],
    roomCount: 6,
    seatsPerRoom: [2, 2, 2, 3, 2, 2],
  },
  {
    name: "মিরপুর ইস্ট স্টুডেন্ট মেস",
    area: "মিরপুর",
    address: "রোড ২, মিরপুর-১০, ঢাকা",
    lat: 23.8128,
    lng: 90.3556,
    type: "STUDENT_MALE",
    rentFrom: 3000,
    rentTo: 5000,
    rating: 3.9,
    reviewCount: 15,
    verified: false,
    featured: false,
    description:
      "সাশ্রয়ী মূল্যে ছাত্রদের জন্য মেস। বাসস্টপ সংলগ্ন।",
    facilities: ["wifi", "gas", "ips", "filtered_water"],
    images: [MESS_IMAGES[0], MESS_IMAGES[6]],
    roomCount: 5,
    seatsPerRoom: [4, 4, 3, 4, 3],
  },
  {
    name: "ধানমন্ডি লেক ভিউ মেস",
    area: "ধানমন্ডি",
    address: "রোড ২৭, ধানমন্ডি, ঢাকা",
    lat: 23.7411,
    lng: 90.3702,
    type: "STUDENT_MALE",
    rentFrom: 5500,
    rentTo: 8500,
    rating: 4.4,
    reviewCount: 33,
    verified: true,
    featured: false,
    description:
      "ধানমন্ডি লেকের দৃশ্যসহ মেস। সকালে হাঁটার জন্য আদর্শ পরিবেশ।",
    facilities: ["wifi", "attached_bath", "ac", "gas", "laundry", "cctv", "ips", "study_table", "filtered_water"],
    images: [MESS_IMAGES[2], MESS_IMAGES[5], MESS_IMAGES[0]],
    roomCount: 5,
    seatsPerRoom: [2, 3, 2, 3, 2],
  },
];

const SEEKER_NAMES = [
  "রাফিউল ইসলাম",
  "তানভীর আহমেদ",
  "সাদিয়া আক্তার",
  "মেহেদী হাসান",
  "ফারহানা ইসলাম",
  "আবদুল্লাহ আল মামুন",
  "নুসরাত জাহান",
  "শাকিল খান",
];

function pickStatus(i: number): "AVAILABLE" | "PENDING" | "BOOKED" | "MAINTENANCE" {
  const cycle = i % 7;
  if (cycle === 0 || cycle === 3) return "BOOKED";
  if (cycle === 1) return "PENDING";
  if (cycle === 5) return "MAINTENANCE";
  return "AVAILABLE";
}

export async function seedDatabase() {
  // Clean up
  await db.adminLog.deleteMany();
  await db.favorite.deleteMany();
  await db.review.deleteMany();
  await db.booking.deleteMany();
  await db.seat.deleteMany();
  await db.room.deleteMany();
  await db.mess.deleteMany();
  await db.user.deleteMany();

  // Create admin
  const admin = await db.user.create({
    data: {
      name: "সাইট এডমিন",
      phone: "01700000000",
      email: "admin@messfinder.bd",
      password: "admin123",
      role: "ADMIN",
      status: "ACTIVE",
      avatar: AVATARS[0],
    },
  });

  // Create owners
  const owner1 = await db.user.create({
    data: {
      name: "মোঃ রহিম উদ্দিন",
      phone: "01711111111",
      email: "rahim@messfinder.bd",
      password: "owner123",
      role: "OWNER",
      status: "ACTIVE",
      avatar: AVATARS[2],
    },
  });
  const owner2 = await db.user.create({
    data: {
      name: "মোছাঃ সালমা বেগম",
      phone: "01722222222",
      email: "salma@messfinder.bd",
      password: "owner123",
      role: "OWNER",
      status: "ACTIVE",
      avatar: AVATARS[1],
    },
  });
  const owner3 = await db.user.create({
    data: {
      name: "তৌফিক এলাহী",
      phone: "01733333333",
      email: "toufiq@messfinder.bd",
      password: "owner123",
      role: "OWNER",
      status: "PENDING",
      avatar: AVATARS[3],
    },
  });

  // Create seekers
  const seekers = await Promise.all(
    SEEKER_NAMES.map((name, i) =>
      db.user.create({
        data: {
          name,
          phone: `0180000000${i}`,
          email: `seeker${i}@messfinder.bd`,
          password: "seeker123",
          role: "SEEKER",
          status: "ACTIVE",
          avatar: AVATARS[i % AVATARS.length],
          preferredAreas: ["মিরপুর", "ধানমন্ডি"][i % 2],
        },
      })
    )
  );

  const owners = [owner1, owner2, owner1, owner2, owner1, owner2, owner1, owner2, owner1, owner2];

  // Create messes
  for (let mi = 0; mi < MESSES.length; mi++) {
    const m = MESSES[mi];
    const owner = owners[mi];
    const mess = await db.mess.create({
      data: {
        name: m.name,
        description: m.description,
        address: m.address,
        area: m.area,
        city: "ঢাকা",
        lat: m.lat,
        lng: m.lng,
        type: m.type,
        rentFrom: m.rentFrom,
        rentTo: m.rentTo,
        rating: m.rating,
        reviewCount: m.reviewCount,
        verified: m.verified,
        published: true,
        featured: m.featured,
        images: JSON.stringify(m.images),
        facilities: JSON.stringify(m.facilities),
        ownerId: owner.id,
      },
    });

    // Create rooms and seats
    let seatIdx = 0;
    for (let ri = 0; ri < m.roomCount; ri++) {
      const roomNumber = `${100 + ri + 1}`;
      const room = await db.room.create({
        data: { number: roomNumber, messId: mess.id },
      });
      const seatCount = m.seatsPerRoom[ri] ?? 3;
      for (let si = 0; si < seatCount; si++) {
        const status = pickStatus(seatIdx);
        const rent = m.rentFrom + ((seatIdx * 250) % (m.rentTo - m.rentFrom));
        await db.seat.create({
          data: {
            number: `${roomNumber}-${String.fromCharCode(65 + si)}`,
            roomId: room.id,
            rent,
            type: seatCount <= 2 ? "SINGLE" : "SHARED",
            status,
          },
        });
        seatIdx++;
      }
    }

    // Create a few reviews
    const reviewCount = Math.min(3, Math.floor(m.reviewCount / 12));
    for (let r = 0; r < reviewCount; r++) {
      const seeker = seekers[(mi + r) % seekers.length];
      await db.review.create({
        data: {
          messId: mess.id,
          userId: seeker.id,
          rating: Math.round(m.rating),
          comment: [
            "খুবই পরিচ্ছন্ন ও নিরাপদ মেস। মালিক সহযোগিতাশীল।",
            "পরিবেশ ভালো, তবে পানির সমস্যা ছিল কিছুটা।",
            "ভাড়ার তুলনায় সুবিধা ভালো। মেট্রোর কাছে হওয়ায় যাতায়াত সহজ।",
          ][r % 3],
          ownerReply: r % 2 === 0 ? "ধন্যবাদ আপনার মতামতের জন্য।" : null,
        },
      });
    }
  }

  // Create a couple of bookings for the first seeker
  const allMesses = await db.mess.findMany({ include: { rooms: { include: { seats: true } } } });
  if (allMesses.length > 0 && seekers.length > 0) {
    const m0 = allMesses[0];
    const seat0 = m0.rooms[0]?.seats[0];
    if (seat0) {
      await db.booking.create({
        data: {
          reference: "MF-2026-04512",
          seatId: seat0.id,
          messId: m0.id,
          seekerId: seekers[0].id,
          moveInDate: new Date(Date.now() + 7 * 86400000),
          duration: "৬ মাস",
          message: "আগামী মাসের ১ তারিখ থেকে থাকতে চাই।",
          status: "PENDING",
        },
      });
    }
    const m2 = allMesses[2];
    const seat2 = m2?.rooms[0]?.seats[0];
    if (seat2) {
      await db.booking.create({
        data: {
          reference: "MF-2026-04513",
          seatId: seat2.id,
          messId: m2.id,
          seekerId: seekers[0].id,
          moveInDate: new Date(Date.now() - 30 * 86400000),
          duration: "১২ মাস",
          message: "",
          status: "CONFIRMED",
        },
      });
    }
  }

  // Create favorites for seeker 0
  if (allMesses.length > 1 && seekers.length > 0) {
    await db.favorite.createMany({
      data: [
        { userId: seekers[0].id, messId: allMesses[1].id },
        { userId: seekers[0].id, messId: allMesses[5].id },
      ],
    });
  }

  return {
    admin: admin.id,
    owners: owners.length,
    seekers: seekers.length,
    messes: MESSES.length,
  };
}
