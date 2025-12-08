import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { NoteStatusEnum } from '../src/entities/note.entity';

describe('Jampa Backend API (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let userId: string;
  const API_KEY = process.env.API_KEY || 'test-api-key';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Endpoints (e2e)', () => {
    describe('/hello (GET)', () => {
      it('should return Hello without API key', () => {
        return request(app.getHttpServer())
          .get('/hello')
          .expect(200)
          .expect('Hello');
      });

      it('should return Hello with API key', () => {
        return request(app.getHttpServer())
          .get('/hello')
          .set('x-api-key', API_KEY)
          .expect(200)
          .expect('Hello');
      });
    });
  });

  describe('API Key Protection (e2e)', () => {
    describe('Protected endpoints', () => {
      it('should fail without API key on /auth/register', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            username: 'testuser',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('API key is missing');
          });
      });

      it('should fail with invalid API key on /auth/login', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .set('x-api-key', 'invalid-key')
          .send({
            email: 'test@example.com',
            password: 'password123',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('Invalid API key');
          });
      });
    });
  });

  describe('Auth Module (e2e)', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      username: `testuser${Date.now()}`,
    };

    describe('/auth/register (POST)', () => {
      it('should register a new user successfully', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .set('x-api-key', API_KEY)
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('access_token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.username).toBe(testUser.username);
            expect(res.body.user).not.toHaveProperty('password');

            // Save token and userId for later tests
            authToken = res.body.access_token;
            userId = res.body.user.id;
          });
      });

      it('should fail to register with duplicate email', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .set('x-api-key', API_KEY)
          .send(testUser)
          .expect(409)
          .expect((res) => {
            expect(res.body.message).toContain('already exists');
          });
      });

      it('should fail to register with invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .set('x-api-key', API_KEY)
          .send({
            email: 'invalid-email',
            password: 'password123',
            username: 'testuser',
          })
          .expect(400);
      });

      it('should fail to register with short password', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .set('x-api-key', API_KEY)
          .send({
            email: 'test2@example.com',
            password: 'short',
            username: 'testuser2',
          })
          .expect(400);
      });

      it('should fail to register with missing fields', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .set('x-api-key', API_KEY)
          .send({
            email: 'test3@example.com',
          })
          .expect(400);
      });
    });

    describe('/auth/login (POST)', () => {
      it('should login successfully with correct credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .set('x-api-key', API_KEY)
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('access_token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
          });
      });

      it('should fail to login with incorrect password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .set('x-api-key', API_KEY)
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('Invalid credentials');
          });
      });

      it('should fail to login with non-existent email', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .set('x-api-key', API_KEY)
          .send({
            email: 'nonexistent@example.com',
            password: 'password123',
          })
          .expect(401);
      });

      it('should fail to login with invalid email format', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .set('x-api-key', API_KEY)
          .send({
            email: 'invalid-email',
            password: 'password123',
          })
          .expect(400);
      });

      it('should fail to login with missing credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });
    });
  });

  describe('Sync Module (e2e)', () => {
    describe('/sync (POST)', () => {
      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .send({
            categories: [],
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(401);
      });

      it('should synchronize with empty data', () => {
        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categories: [],
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('lastSyncAt');
            expect(res.body).toHaveProperty('categories');
            expect(res.body).toHaveProperty('noteTypes');
            expect(res.body).toHaveProperty('notes');
            expect(res.body).toHaveProperty('reminders');
            expect(res.body).toHaveProperty('schedules');
          });
      });

      it('should synchronize with new categories', () => {
        const categoryId = `cat-${Date.now()}`;
        const now = new Date().toISOString();

        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categories: [
              {
                id: categoryId,
                name: 'Work',
                createdAt: now,
                updatedAt: now,
              },
            ],
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('lastSyncAt');
          });
      });

      it('should synchronize with new note types', () => {
        const noteTypeId = `type-${Date.now()}`;
        const now = new Date().toISOString();

        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categories: [],
            noteTypes: [
              {
                id: noteTypeId,
                name: 'Task',
                createdAt: now,
                updatedAt: now,
              },
            ],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('lastSyncAt');
          });
      });

      it('should synchronize with new notes', () => {
        const noteId = `note-${Date.now()}`;
        const now = new Date().toISOString();

        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categories: [],
            noteTypes: [],
            notes: [
              {
                id: noteId,
                title: 'Test Note',
                content: 'This is a test note',
                isImportant: false,
                status: NoteStatusEnum.TODO,
                createdAt: now,
                updatedAt: now,
              },
            ],
            reminders: [],
            schedules: [],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('lastSyncAt');
          });
      });

      it('should synchronize with lastSyncAt timestamp', () => {
        const lastSyncAt = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago

        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            lastSyncAt,
            categories: [],
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('lastSyncAt');
            expect(new Date(res.body.lastSyncAt).getTime()).toBeGreaterThan(
              new Date(lastSyncAt).getTime(),
            );
          });
      });

      it('should fail with invalid data format', () => {
        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categories: 'invalid',
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(400);
      });

      it('should fail with invalid JWT token', () => {
        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', 'Bearer invalid-token')
          .send({
            categories: [],
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(401);
      });

      it('should synchronize with schedules', () => {
        const scheduleId = `schedule-${Date.now()}`;
        const noteId = `note-${Date.now()}`;
        const now = new Date().toISOString();

        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categories: [],
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [
              {
                id: scheduleId,
                noteId: noteId,
                recurrenceType: 'daily',
                createdAt: now,
                updatedAt: now,
              },
            ],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('lastSyncAt');
          });
      });

      it('should handle deleted items with deletedAt timestamp', () => {
        const categoryId = `cat-deleted-${Date.now()}`;
        const now = new Date().toISOString();

        return request(app.getHttpServer())
          .post('/sync')
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categories: [
              {
                id: categoryId,
                name: 'Deleted Category',
                createdAt: now,
                updatedAt: now,
                deletedAt: now,
              },
            ],
            noteTypes: [],
            notes: [],
            reminders: [],
            schedules: [],
          })
          .expect(200);
      });
    });
  });
});
