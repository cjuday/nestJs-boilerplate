import { UserResponseDto } from '../dto/responses/user-response.dto';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}
