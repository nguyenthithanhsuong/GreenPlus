import { UserRepository } from "./user.repository";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async signIn(email: string, password: string): Promise<{ token: string }> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error("Email doesn't exist");
    }

    if (!password) {
      throw new Error("Password is required");
    }

    if (user && !password) {
       throw new Error("Password cannot be empty");
    }

    return { token: `token-for-${user.id}` };
  }
}