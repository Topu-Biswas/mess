// Shared application types for Mess Finder

export type Role = "GUEST" | "SEEKER" | "OWNER" | "ADMIN";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export type MessType = "STUDENT_MALE" | "STUDENT_FEMALE" | "FAMILY";

export type SeatStatus = "AVAILABLE" | "PENDING" | "BOOKED" | "MAINTENANCE";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "WAITLISTED";

export type AppView =
  | "home"
  | "search"
  | "details"
  | "seat-select"
  | "booking-status"
  | "seeker-dashboard"
  | "owner-dashboard"
  | "admin-dashboard"
  | "how-it-works"
  | "contact";

export type OwnerTab =
  | "overview"
  | "messes"
  | "rooms"
  | "requests"
  | "tenants"
  | "income"
  | "reviews"
  | "settings";

export type AdminTab =
  | "overview"
  | "owners"
  | "listings"
  | "users"
  | "reports"
  | "config"
  | "logs";

export type SeekerTab =
  | "bookings"
  | "payments"
  | "favorites"
  | "messages"
  | "settings";

export interface Facility {
  key: string;
  label: string;
  icon: string; // lucide icon name
}

export interface PublicUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
  status: UserStatus;
  avatar: string | null;
  preferredAreas: string | null;
}

export interface SeatWithRoom {
  id: string;
  number: string;
  rent: number;
  type: string;
  status: SeatStatus;
  roomId: string;
  roomNumber: string;
}

export interface MessDetail {
  id: string;
  name: string;
  description: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  type: MessType;
  rentFrom: number;
  rentTo: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  reported: boolean;
  images: string[];
  facilities: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerVerified: boolean;
  rooms: {
    id: string;
    number: string;
    seats: {
      id: string;
      number: string;
      rent: number;
      type: string;
      status: SeatStatus;
    }[];
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    userName: string;
    ownerReply: string | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface MessSummary {
  id: string;
  name: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  type: MessType;
  rentFrom: number;
  rentTo: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  image: string;
  totalSeats: number;
  availableSeats: number;
  facilities: string[];
}

export interface BookingWithRelations {
  id: string;
  reference: string;
  status: BookingStatus;
  moveInDate: string;
  duration: string;
  durationMonths: number;
  message: string | null;
  rejectReason: string | null;
  createdAt: string;
  messId: string;
  messName: string;
  messArea: string;
  messImage: string;
  seatNumber: string;
  roomNumber: string;
  rent: number;
  agreedRent: number;
  securityDeposit: number;
  seekerName: string;
  seekerPhone: string;
  seekerId: string;
}

export interface Filters {
  budgetMin: number;
  budgetMax: number;
  radiusKm: number;
  types: MessType[];
  facilities: string[];
  onlyAvailable: boolean;
  minRating: number;
  area: string;
  useLocation: boolean;
  userLat: number | null;
  userLng: number | null;
}

export const DEFAULT_FILTERS: Filters = {
  budgetMin: 0,
  budgetMax: 20000,
  radiusKm: 5,
  types: [],
  facilities: [],
  onlyAvailable: false,
  minRating: 0,
  area: "",
  useLocation: false,
  userLat: null,
  userLng: null,
};

export const FACILITIES: Facility[] = [
  { key: "wifi", label: "ওয়াইফাই", icon: "Wifi" },
  { key: "attached_bath", label: "অ্যাটাচড বাথরুম", icon: "ShowerHead" },
  { key: "ac", label: "এসি", icon: "Snowflake" },
  { key: "gas", label: "গ্যাস/কুকিং", icon: "Flame" },
  { key: "laundry", label: "লন্ড্রি", icon: "WashingMachine" },
  { key: "cctv", label: "সিসিটিভি", icon: "Cctv" },
  { key: "ips", label: "জেনারেটর/আইপিএস", icon: "Zap" },
  { key: "furnished", label: "ফার্নিশড", icon: "Sofa" },
  { key: "study_table", label: "স্টাডি টেবিল", icon: "BookOpen" },
  { key: "filtered_water", label: "ফিল্টার্ড পানি", icon: "Droplets" },
  { key: "lift", label: "লিফট", icon: "ArrowUpDown" },
];

export const MESS_TYPE_LABELS: Record<MessType, string> = {
  STUDENT_MALE: "ছাত্র",
  STUDENT_FEMALE: "ছাত্রী",
  FAMILY: "ফ্যামিলি",
};

export const POPULAR_AREAS = [
  { name: "মিরপুর", lat: 23.8068, lng: 90.3686 },
  { name: "ধানমন্ডি", lat: 23.7461, lng: 90.3742 },
  { name: "মোহাম্মদপুর", lat: 23.7657, lng: 90.3585 },
  { name: "শাহবাগ", lat: 23.7333, lng: 90.3929 },
  { name: "ফার্মগেট", lat: 23.7536, lng: 90.3933 },
  { name: "বনানী", lat: 23.7937, lng: 90.4066 },
  { name: "গুলশান", lat: 23.7806, lng: 90.4193 },
  { name: "উত্তরা", lat: 23.8728, lng: 90.3984 },
];
