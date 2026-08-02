import { UserResponseDto } from '../dto/responses/user-response.dto';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
  user: UserResponseDto;
}
