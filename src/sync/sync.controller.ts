import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncService } from './sync.service';
import { SyncRequestDto } from './dto/sync.dto';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async synchronize(
    @Request() req: { user: { userId: string } },
    @Body() syncData: SyncRequestDto,
  ) {
    return this.syncService.synchronize(req.user.userId, syncData);
  }
}
