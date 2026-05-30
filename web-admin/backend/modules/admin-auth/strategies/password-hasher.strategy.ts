import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

export interface PasswordHasherStrategy {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

// Strategy pattern: co the thay doi thuat toan hash ma khong sua Auth Facade.
export class Pbkdf2HasherStrategy implements PasswordHasherStrategy {
  private readonly iterations = 100_000;
  private readonly keyLength = 64;
  private readonly digest = "sha512";

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const hashed = pbkdf2Sync(password, salt, this.iterations, this.keyLength, this.digest).toString("hex");
    return `pbkdf2$${this.iterations}$${salt}$${hashed}`;
  }

  async compare(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, iterationText, salt, hashHex] = storedHash.split("$");
    if (algorithm !== "pbkdf2" || !iterationText || !salt || !hashHex) {
      return false;
    }

    const iterations = Number(iterationText);
    if (!Number.isFinite(iterations)) {
      return false;
    }

    const computed = pbkdf2Sync(password, salt, iterations, this.keyLength, this.digest);
    const original = Buffer.from(hashHex, "hex");

    if (computed.length !== original.length) {
      return false;
    }

    return timingSafeEqual(computed, original);
  }
}
