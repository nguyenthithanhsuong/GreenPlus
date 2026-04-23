import { AppError } from "../../../core/errors";

export interface RoleNameStrategy {
  normalize(value: string): string;
  display(value: string): string;
}

export class DefaultRoleNameStrategy implements RoleNameStrategy {
  normalize(value: string): string {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      throw new AppError("role name is required", 400);
    }

    if (normalized.length > 30) {
      throw new AppError("role name must be at most 30 characters", 400);
    }

    return normalized;
  }

  display(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return "";
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
