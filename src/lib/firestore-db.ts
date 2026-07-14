// Firestore data access layer — replaces Prisma
// Uses Firebase client SDK (works in both browser and Node.js API routes)
import { adminDb } from "@/lib/firebase-admin";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

// ============ Types ============
export interface FirestoreUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoURL: string | null;
  role: "SEEKER" | "OWNER" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  commissionRate: number;
  preferredAreas: string | null;
  createdAt: Timestamp;
}

export interface FirestoreMess {
  id: string;
  name: string;
  description: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  type: string;
  rentFrom: number;
  rentTo: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  published: boolean;
  featured: boolean;
  reported: boolean;
  reportReason: string | null;
  images: string[];
  facilities: string[];
  ownerId: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreRoom {
  id: string;
  number: string;
  messId: string;
}

export interface FirestoreSeat {
  id: string;
  number: string;
  roomId: string;
  messId: string;
  rent: number;
  type: string;
  status: "AVAILABLE" | "PENDING" | "BOOKED" | "MAINTENANCE";
}

export interface FirestoreBooking {
  id: string;
  reference: string;
  seatId: string;
  messId: string;
  seekerId: string;
  moveInDate: Timestamp;
  duration: string;
  durationMonths: number;
  message: string | null;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "WAITLISTED" | "CHECKED_OUT";
  rejectReason: string | null;
  agreedRent: number;
  securityDeposit: number;
  checkOutDate: Timestamp | null;
  createdAt: Timestamp;
}

export interface FirestorePayment {
  id: string;
  bookingId: string;
  seekerId: string;
  messId: string;
  amount: number;
  type: "RENT" | "DEPOSIT" | "UTILITY" | "LATE_FEE" | "OTHER";
  month: string;
  dueDate: Timestamp;
  paidDate: Timestamp | null;
  status: "DUE" | "PAID" | "OVERDUE" | "PARTIAL";
  method: string | null;
  reference: string | null;
  note: string | null;
}

export interface FirestoreExpense {
  id: string;
  messId: string;
  ownerId: string;
  category: string;
  amount: number;
  description: string;
  date: Timestamp;
  recurring: boolean;
}

export interface FirestoreReview {
  id: string;
  messId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  ownerReply: string | null;
  createdAt: Timestamp;
}

export interface FirestoreFavorite {
  id: string;
  userId: string;
  messId: string;
}

export interface FirestoreAdminLog {
  id: string;
  action: string;
  target: string;
  reason: string | null;
  createdAt: Timestamp;
}

// ============ User Operations ============
export async function getUserById(id: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(adminDb, "users", id));
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as FirestoreUser;
}

export async function getUserByEmail(email: string): Promise<FirestoreUser | null> {
  const q = query(collection(adminDb, "users"), where("email", "==", email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as FirestoreUser;
}

export async function createUser(data: Omit<FirestoreUser, "id" | "createdAt">): Promise<FirestoreUser> {
  const ref = await addDoc(collection(adminDb, "users"), { ...data, createdAt: serverTimestamp() });
  return { ...data, id: ref.id, createdAt: Timestamp.now() } as FirestoreUser;
}

export async function updateUser(id: string, data: Partial<FirestoreUser>): Promise<void> {
  await updateDoc(doc(adminDb, "users", id), data as Record<string, unknown>);
}

export async function getUserByPhone(phone: string): Promise<FirestoreUser | null> {
  const q = query(collection(adminDb, "users"), where("phone", "==", phone), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as FirestoreUser;
}

export async function getBookingByReference(reference: string): Promise<FirestoreBooking | null> {
  const q = query(collection(adminDb, "bookings"), where("reference", "==", reference), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as FirestoreBooking;
}

export async function getUsersByRole(role: string): Promise<FirestoreUser[]> {
  const q = query(collection(adminDb, "users"), where("role", "==", role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreUser);
}

export async function getUsersByRoleStatus(role: string, status: string): Promise<FirestoreUser[]> {
  const q = query(collection(adminDb, "users"), where("role", "==", role), where("status", "==", status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreUser);
}

export async function getAllUsers(): Promise<FirestoreUser[]> {
  const snap = await getDocs(collection(adminDb, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreUser);
}

// ============ Mess Operations ============
export async function getMessById(id: string): Promise<FirestoreMess | null> {
  const snap = await getDoc(doc(adminDb, "messes", id));
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as FirestoreMess;
}

export async function getMessesByOwner(ownerId: string): Promise<FirestoreMess[]> {
  const q = query(collection(adminDb, "messes"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreMess);
}

export async function getAllMesses(): Promise<FirestoreMess[]> {
  const snap = await getDocs(collection(adminDb, "messes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreMess);
}

export async function createMess(data: Omit<FirestoreMess, "id" | "createdAt" | "updatedAt" | "totalSeats" | "availableSeats" | "rating" | "reviewCount" | "reported" | "reportReason">): Promise<string> {
  const ref = await addDoc(collection(adminDb, "messes"), {
    ...data,
    rating: 0,
    reviewCount: 0,
    reported: false,
    reportReason: null,
    totalSeats: 0,
    available_seats: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMess(id: string, data: Partial<FirestoreMess>): Promise<void> {
  await updateDoc(doc(adminDb, "messes", id), { ...data, updatedAt: serverTimestamp() } as Record<string, unknown>);
}

// ============ Room Operations ============
export async function getRoomsByMess(messId: string): Promise<FirestoreRoom[]> {
  const q = query(collection(adminDb, "rooms"), where("messId", "==", messId));
  const snap = await getDocs(q);
  const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreRoom);
  return rooms.sort((a, b) => a.number.localeCompare(b.number));
}

export async function createRoom(messId: string, number: string): Promise<string> {
  const ref = await addDoc(collection(adminDb, "rooms"), { number, messId });
  return ref.id;
}

// ============ Seat Operations ============
export async function getSeatsByRoom(roomId: string): Promise<FirestoreSeat[]> {
  const q = query(collection(adminDb, "seats"), where("roomId", "==", roomId));
  const snap = await getDocs(q);
  const seats = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreSeat);
  return seats.sort((a, b) => a.number.localeCompare(b.number));
}

export async function getSeatsByMess(messId: string): Promise<FirestoreSeat[]> {
  const q = query(collection(adminDb, "seats"), where("messId", "==", messId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreSeat);
}

export async function createSeat(data: Omit<FirestoreSeat, "id">): Promise<string> {
  const ref = await addDoc(collection(adminDb, "seats"), data);
  return ref.id;
}

export async function updateSeat(id: string, data: Partial<FirestoreSeat>): Promise<void> {
  await updateDoc(doc(adminDb, "seats", id), data as Record<string, unknown>);
}

export async function getSeatById(id: string): Promise<FirestoreSeat | null> {
  const snap = await getDoc(doc(adminDb, "seats", id));
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as FirestoreSeat;
}

// ============ Booking Operations ============
export async function getBookingById(id: string): Promise<FirestoreBooking | null> {
  const snap = await getDoc(doc(adminDb, "bookings", id));
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as FirestoreBooking;
}

export async function getBookingsBySeeker(seekerId: string): Promise<FirestoreBooking[]> {
  const q = query(collection(adminDb, "bookings"), where("seekerId", "==", seekerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreBooking);
}

export async function getBookingsByMess(messId: string): Promise<FirestoreBooking[]> {
  const q = query(collection(adminDb, "bookings"), where("messId", "==", messId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreBooking);
}

export async function getBookingsByMessIds(messIds: string[], status?: string): Promise<FirestoreBooking[]> {
  if (messIds.length === 0) return [];
  const q = status
    ? query(collection(adminDb, "bookings"), where("messId", "in", messIds), where("status", "==", status))
    : query(collection(adminDb, "bookings"), where("messId", "in", messIds));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreBooking);
}

export async function createBooking(data: Omit<FirestoreBooking, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(adminDb, "bookings"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateBooking(id: string, data: Partial<FirestoreBooking>): Promise<void> {
  await updateDoc(doc(adminDb, "bookings", id), data as Record<string, unknown>);
}

// ============ Payment Operations ============
export async function getPaymentsBySeeker(seekerId: string): Promise<FirestorePayment[]> {
  const q = query(collection(adminDb, "payments"), where("seekerId", "==", seekerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestorePayment);
}

export async function getPaymentsByMess(messId: string): Promise<FirestorePayment[]> {
  const q = query(collection(adminDb, "payments"), where("messId", "==", messId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestorePayment);
}

export async function getPaymentsByMessIds(messIds: string[]): Promise<FirestorePayment[]> {
  if (messIds.length === 0) return [];
  // Firestore "in" supports max 30 values
  const chunks: string[][] = [];
  for (let i = 0; i < messIds.length; i += 30) chunks.push(messIds.slice(i, i + 30));
  const results: FirestorePayment[] = [];
  for (const chunk of chunks) {
    const q = query(collection(adminDb, "payments"), where("messId", "in", chunk));
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestorePayment));
  }
  return results;
}

export async function getPaymentsByBooking(bookingId: string): Promise<FirestorePayment[]> {
  const q = query(collection(adminDb, "payments"), where("bookingId", "==", bookingId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestorePayment);
}

export async function createPayment(data: Omit<FirestorePayment, "id">): Promise<string> {
  const ref = await addDoc(collection(adminDb, "payments"), data);
  return ref.id;
}

export async function updatePayment(id: string, data: Partial<FirestorePayment>): Promise<void> {
  await updateDoc(doc(adminDb, "payments", id), data as Record<string, unknown>);
}

export async function getPaymentById(id: string): Promise<FirestorePayment | null> {
  const snap = await getDoc(doc(adminDb, "payments", id));
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as FirestorePayment;
}

// ============ Expense Operations ============
export async function getExpensesByOwner(ownerId: string): Promise<FirestoreExpense[]> {
  const q = query(collection(adminDb, "expenses"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreExpense);
}

export async function getExpensesByMess(messId: string): Promise<FirestoreExpense[]> {
  const q = query(collection(adminDb, "expenses"), where("messId", "==", messId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreExpense);
}

export async function createExpense(data: Omit<FirestoreExpense, "id">): Promise<string> {
  const ref = await addDoc(collection(adminDb, "expenses"), data);
  return ref.id;
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(adminDb, "expenses", id));
}

// ============ Review Operations ============
export async function getReviewsByMess(messId: string): Promise<FirestoreReview[]> {
  const q = query(collection(adminDb, "reviews"), where("messId", "==", messId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreReview);
}

export async function createReview(data: Omit<FirestoreReview, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(adminDb, "reviews"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

// ============ Favorite Operations ============
export async function getFavoritesByUser(userId: string): Promise<FirestoreFavorite[]> {
  const q = query(collection(adminDb, "favorites"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreFavorite);
}

export async function toggleFavorite(userId: string, messId: string): Promise<boolean> {
  const q = query(collection(adminDb, "favorites"), where("userId", "==", userId), where("messId", "==", messId));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(collection(adminDb, "favorites"), { userId, messId });
    return true;
  } else {
    await deleteDoc(snap.docs[0].ref);
    return false;
  }
}

// ============ Admin Log Operations ============
export async function createAdminLog(action: string, target: string, reason: string | null): Promise<void> {
  await addDoc(collection(adminDb, "adminLogs"), { action, target, reason, createdAt: serverTimestamp() });
}

export async function getAdminLogs(): Promise<FirestoreAdminLog[]> {
  const q = query(collection(adminDb, "adminLogs"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreAdminLog);
}

// ============ Utility ============
export async function deleteCollection(name: string): Promise<void> {
  const snap = await getDocs(collection(adminDb, name));
  const batch = writeBatch(adminDb);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function clearAllData(): Promise<void> {
  await deleteCollection("favorites");
  await deleteCollection("adminLogs");
  await deleteCollection("reviews");
  await deleteCollection("payments");
  await deleteCollection("expenses");
  await deleteCollection("bookings");
  await deleteCollection("seats");
  await deleteCollection("rooms");
  await deleteCollection("messes");
  await deleteCollection("users");
}

export { adminDb, Timestamp, serverTimestamp };
