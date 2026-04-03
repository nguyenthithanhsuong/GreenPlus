export type UserStatus = "active" | "inactive" | "banned" | "suspended";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type UpdateProfileInput = {
  userId: string;
  name: string;
  phone: string;
  address?: string;
  imageUrl?: string;
};

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type SessionInfo = {
  session_id: string;
  user_id: string;
  login_time: string;
};
