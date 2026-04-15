import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModerationService } from './moderation.service';
import { CreatePlatformReportDto } from './dto/create-platform-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  create(@Body() dto: CreatePlatformReportDto, @Req() req: any) {
    return this.moderationService.createReport(dto, req.user.userId, req.user.role);
  }
}
