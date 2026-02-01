import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { User } from "./user.entity";
import { CreateUserDto, UpdateUserDto, ListUsersQueryDto } from "./user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(query?: ListUsersQueryDto): Promise<User[]> {
    const where: any = {};
    if (query?.role) where.role = query.role;
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    if (query?.search) where.name = Like(`%${query.search}%`);

    return this.usersRepository.find({
      where: Object.keys(where).length > 0 ? where : { isActive: true },
      order: { name: "ASC" },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByAuthUid(authUid: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { authUid } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const id = await this.generateId();
    const user = this.usersRepository.create({ ...dto, id });
    return this.usersRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  private async generateId(): Promise<string> {
    const count = await this.usersRepository.count();
    return `USR-${String(count + 1).padStart(4, "0")}`;
  }
}
