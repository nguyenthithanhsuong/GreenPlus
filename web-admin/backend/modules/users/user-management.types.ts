export type UserStatus = "active" | "inactive" | "banned";

export type UserRow = {
  user_id: string;
  role_id: string | null;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
  status: UserStatus;
  created_at: string;
  image_url: string | null;
  roles?: {
    role_name?: string | null;
  } | null;
};

export type UserSummary = {
  user_id: string;
  role_id: string | null;
  role_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: UserStatus;
  created_at: string;
  image_url: string | null;
};

export type CreateUserInput = {
  roleId?: string | null;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  imageUrl?: string;
  status?: UserStatus;
};

export type UpdateUserInput = {
  userId: string;
  roleId?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  imageUrl?: string;
  status?: UserStatus;
};
