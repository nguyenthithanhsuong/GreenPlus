export type User = {
  id: string;
  email: string;
};

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    return {
      id: "demo-user",
      email,
    };
  }
}
