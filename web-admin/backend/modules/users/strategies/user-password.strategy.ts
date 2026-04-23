import { pbkdf2Sync, randomBytes } from "node:crypto";

export interface UserPasswordStrategy {
  hash(raw: string): string;
}

class Pbkdf2UserPasswordStrategy implements UserPasswordStrategy {
  hash(raw: string): string {
    const salt = randomBytes(16).toString("hex");
    const digest = pbkdf2Sync(raw, salt, 120000, 64, "sha512").toString("hex");
    return `pbkdf2$${salt}$${digest}`;
  }
}

export function createUserPasswordStrategy(): UserPasswordStrategy {
  return new Pbkdf2UserPasswordStrategy();
}
