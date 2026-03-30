import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signIn(email: string, password: string): Promise<{ token: string }> {
    return this.authService.signIn(email, password);
  }
}
