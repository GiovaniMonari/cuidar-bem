import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModerationService } from './moderation.service';
import { CreatePlatformReportDto } from './dto/create-platform-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  @ApiOperation({ summary: 'Criar denúncia da plataforma' })
  @ApiBody({ type: CreatePlatformReportDto })
  create(@Body() dto: CreatePlatformReportDto, @Req() req: any) {
    return this.moderationService.createReport(dto, req.user.userId, req.user.role);
  }
}
