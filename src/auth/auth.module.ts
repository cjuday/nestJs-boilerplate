import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionsModule } from 'src/sessions/sessions.module';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { TokenService } from './token/token.service';
import { MailModule } from 'src/mail/mail.module';
import { EmailVerificationModule } from 'src/email-verification/email-verification.module';

@Module({
  imports: [JwtModule.register({}), UsersModule, SessionsModule, EmailVerificationModule, MailModule],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy, TokenService],
})
export class AuthModule {}
