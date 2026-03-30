import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async verifySession(accessToken: string) {
    return this.authService.verifySession(accessToken);
  }
}
