import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PermissionsGuard],
  exports: [UsersService]
})

export class UsersModule {}
