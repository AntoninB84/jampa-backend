import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRATION') return defaultValue || '30d';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      const hashedPassword = 'hashedpassword';
      const createdUser = {
        id: '123',
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);
      mockJwtService.sign
        .mockReturnValueOnce('jwt-access-token')
        .mockReturnValueOnce('jwt-refresh-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          username: createdUser.username,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existinguser',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: '123' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '123',
        email: loginDto.email,
        username: 'testuser',
        password: 'hashedpassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('jwt-access-token')
        .mockReturnValueOnce('jwt-refresh-token');
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: '123',
        email: loginDto.email,
        password: 'hashedpassword',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const userId = '123';
      const user = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(userId);

      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return null if user not found', async () => {
      const userId = '123';

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      const refreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };

      const user = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        refreshToken: 'valid-refresh-token',
      };

      const payload = { email: user.email, sub: user.id };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const refreshTokenDto = {
        refresh_token: 'invalid-token',
      };

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token does not match stored token', async () => {
      const refreshTokenDto = {
        refresh_token: 'valid-but-different-token',
      };

      const user = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        refreshToken: 'stored-token',
      };

      const payload = { email: user.email, sub: user.id };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshTokenDto = {
        refresh_token: 'valid-token',
      };

      const payload = { email: 'test@example.com', sub: '123' };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
