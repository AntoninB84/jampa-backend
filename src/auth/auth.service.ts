import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const { access_token, refresh_token } = await this.generateTokens(user);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { access_token, refresh_token } = await this.generateTokens(user);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find user and validate stored refresh token
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refresh_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: User): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const payload = { email: user.email, sub: user.id };

    const access_token = this.jwtService.sign(payload);

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '30d',
    );

    // Use any type assertion since JwtService has strict type overloads
    const refresh_token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration as any,
    });

    // Store refresh token in database
    user.refreshToken = refresh_token;
    await this.userRepository.save(user);

    return {
      access_token,
      refresh_token,
    };
  }

  private generateToken(user: User): string {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
