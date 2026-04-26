import { pbkdf2Sync, randomBytes } from "node:crypto";

export interface UserPasswordStrategy {
  hash(raw: string): string;
  verify(raw: string, stored: string): boolean;
}

class Pbkdf2UserPasswordStrategy implements UserPasswordStrategy {
  private readonly iterations = 120000;
  private readonly keylen = 64;
  private readonly digest = "sha512";

  hash(raw: string): string {
    const salt = randomBytes(16).toString("hex");

    const derivedKey = pbkdf2Sync(
      raw,
      salt,
      this.iterations,
      this.keylen,
      this.digest
    ).toString("hex");

    return `pbkdf2$${this.iterations}$${salt}$${derivedKey}`;
  }

  verify(raw: string, stored: string): boolean {
    const parts = stored.split("$");

    // handle invalid format safely
    if (parts.length !== 4 || parts[0] !== "pbkdf2") {
      return false;
    }

    const [, iterationsStr, salt, originalHash] = parts;
    const iterations = Number(iterationsStr);

    if (!iterations) return false;

    const derivedKey = pbkdf2Sync(
      raw,
      salt,
      iterations,
      this.keylen,
      this.digest
    ).toString("hex");

    return derivedKey === originalHash;
  }
}

export function createUserPasswordStrategy(): UserPasswordStrategy {
  return new Pbkdf2UserPasswordStrategy();
}