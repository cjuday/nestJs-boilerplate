import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService]
})
export class EmailVerificationModule {}
