/** FoodBot TypeScript-Interfaces (Client-side) */

export interface FoodUser {
  id: number;
  name: string;
  personalNumber: string;
  cardId: string | null;
  mobileToken: string | null;
}

export interface FoodMenu {
  id: number;
  date: string;
  description: string;
  zweiMenuesAktiv: boolean;
  menu1Name: string | null;
  menu2Name: string | null;
  registrationDeadline: string;
  deadlineEnabled: boolean;
}

export interface FoodRegistration {
  id: number;
  userId: number;
  date: string;
  menuChoice: number;
  userName?: string;
  personalNumber?: string;
}

export interface FoodGuest {
  id: number;
  date: string;
  menuChoice: number;
  count: number;
}

export interface FoodAdminLogEntry {
  id: number;
  timestamp: string;
  adminUser: string;
  action: string;
  details: string | null;
}

export interface FoodPresetMenu {
  id: number;
  name: string;
  sortOrder: number;
}

export interface FoodStatus {
  date: string;
  menu: FoodMenu | null;
  registrationCount: number;
  guests: { menu1: number; menu2: number };
  totalCount: number;
}

export interface FoodKitchenData {
  menu: FoodMenu | null;
  registrations: FoodRegistration[];
  guests: { menu1: number; menu2: number };
  totalCount: number;
}
