export type StoreStatus = "active" | "inactive" | "closed";

export type StoreRow = {
  store_id: string;
  name: string;
  description: string | null;
  address: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string;
  status: StoreStatus;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateStoreInput = {
  name: string;
  description?: string | null;
  address: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  managerId: string;
  status?: StoreStatus;
  latitude?: number | string | null;
  longitude?: number | string | null;
  openingTime?: string | null;
  closingTime?: string | null;
};

export type UpdateStoreInput = {
  storeId: string;
  name?: string;
  description?: string | null;
  address?: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  managerId?: string;
  status?: StoreStatus;
  latitude?: number | string | null;
  longitude?: number | string | null;
  openingTime?: string | null;
  closingTime?: string | null;
};