import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      const expectedResult = {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        user: {
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existinguser',
      };

      mockAuthService.register.mockRejectedValue(
        new ConflictException(
          'User with this email or username already exists',
        ),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        user: {
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };

      const expectedResult = {
        access_token: 'new-jwt-access-token',
        refresh_token: 'new-jwt-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(service.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
      expect(service.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'invalid-token',
      };

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });
  });
});
