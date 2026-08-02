import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: {
      origin: true,
      credentials: true,
    }
  }
})

export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  handleDisconnect(client: Socket) {}

  async handleConnection(client: Socket) {}
}