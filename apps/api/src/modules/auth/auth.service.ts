import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { User } from "../users/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    return user;
  }

  async login(
    user: { id: string; email: string; name: string; role?: string },
    role: string = "user",
  ) {
    // Include role in JWT payload for RBAC
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: role,
    };
    await this.usersService.updateLastLogin(user.id);
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role,
      },
    };
  }

  async loginOrCreate(profile: {
    email: string;
    name: string;
    provider: string;
    uid: string;
    // NOTE: role is NOT accepted from client - this is intentional for security
    // Role comes from backend database to prevent privilege escalation
  }) {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // New users get default 'user' role (defined in entity)
      user = await this.usersService.create({
        email: profile.email,
        name: profile.name,
        authProvider: profile.provider,
        authUid: profile.uid,
      });
    }

    // SECURITY: Use role from database, NOT from client request
    const role = user.role || "user";
    return this.login(user, role);
  }
}
