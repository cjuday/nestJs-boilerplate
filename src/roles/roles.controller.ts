import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @UseGuards(PermissionsGuard)
    @Permissions('roles', 'view')
    @Get()
    findAll() {
        return this.rolesService.findAll();
    }

    @Get('options')
    @UseGuards(PermissionsGuard)
    @Permissions('users', 'view')
    findOptions() {
        return this.rolesService.findAll();
    }
}
