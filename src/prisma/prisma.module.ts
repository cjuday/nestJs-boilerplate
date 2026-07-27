import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  imports: [OrganizationsModule],
})
export class PrismaModule {}
