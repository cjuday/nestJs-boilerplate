import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true
  }
})

export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  emitToUser(userId: string, event: string, data?: unknown) {
    this.server.to(userId).emit(event, data); 
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers.authorization?.replace('Bearer ', '');

      if(!token) {
        throw new UnauthorizedException();
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET')
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException();
      }

      client.data.userId = user.id;

      await client.join(user.id);
    }catch (error){
      console.error('Socket connection failed:', error);
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    client.leave(client.data.userId);
  }
}