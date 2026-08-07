import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  findById(id: string) {
    if(!id) {
        return null;
    }

    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: profileSelect
    });

    if (!profile) {
      throw new UnauthorizedException('Unauthorized.');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if(!user) {
      throw new UnauthorizedException('Unauthorized!');
    }

    return this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        name: dto.name,
        phoneNumber: dto.phoneNumber
      },
      select: profileSelect
    });
  }
}
