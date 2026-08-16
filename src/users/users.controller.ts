import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { usersTableConfig } from './users.table';
import { UsersQueryDto } from './dto/users-query.dto';
import type { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(PermissionsGuard)
  @Permissions('users', 'create')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('users', 'view')
  @Get()
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('users', 'view')
  @Get('table-config')
  getTableConfig() {
    return usersTableConfig;
  }

  @UseGuards(PermissionsGuard)
  @Permissions('users', 'view')
  @Get('export')
  async exportUsers(@Query() query: UsersQueryDto, @Res() response: Response) {
    const buffer = await this.usersService.exportUsers(query);

    response.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="users.xlsx"',
    });

    response.end(buffer);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('users', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    const updateUser = await this.usersService.updateProfile(user.sub, dto);

    return {
      message: 'Profile updated successfully.',
      user: updateUser
    }
  }

  @UseGuards(PermissionsGuard)
  @Permissions('users', 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions('users', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }
}
