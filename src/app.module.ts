import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Note } from './entities/note.entity';
import { NoteType } from './entities/note-type.entity';
import { NoteCategory } from './entities/note-category.entity';
import { Reminder } from './entities/reminder.entity';
import { Schedule } from './entities/schedule.entity';
import { ApiKeyGuard } from './auth/api-key.guard';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          User,
          Category,
          Note,
          NoteType,
          NoteCategory,
          Reminder,
          Schedule,
        ],
        synchronize: true, // Set to false in production
        logging: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
