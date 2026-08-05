import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    UsersModule,
  ],
  providers: [
    RealtimeGateway,
    RealtimeService,
  ],
  exports: [
    RealtimeGateway,
    RealtimeService,
  ],
})
export class RealtimeModule {}