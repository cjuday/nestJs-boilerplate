import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: createOrganizationDto,
    });
  }

  findAll() {
    return this.prisma.organization.findMany({ where: { deletedAt: null }});
  }

  async findOne(id: string) {
    const organization =  await this.prisma.organization.findUnique({where: { id, deletedAt: null, }});

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOne(id);

    return this.prisma.organization.update({where: { id }, data: updateOrganizationDto})
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.organization.update({ where: { id }, data: { deletedAt: new Date()}})
  }
}
