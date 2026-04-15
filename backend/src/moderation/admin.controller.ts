import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ModerationService } from './moderation.service';
import { ReviewPlatformReportDto } from './dto/review-platform-report.dto';
import { UpdateUserModerationDto } from './dto/update-user-moderation.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('dashboard')
  getDashboard() {
    return this.moderationService.getDashboard();
  }

  @Get('users')
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<any> {
    return this.moderationService.listUsers(search, role, status);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.moderationService.getUserDetail(id);
  }

  @Patch('users/:id/moderation')
  updateUserModeration(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateUserModerationDto,
  ) {
    return this.moderationService.updateUserModeration(id, req.user.userId, dto);
  }

  @Get('reports')
  listReports(@Query('status') status?: string, @Query('source') source?: string) {
    return this.moderationService.listReports(status, source);
  }

  @Get('reports/:id')
  getReportDetail(@Param('id') id: string) {
    return this.moderationService.getReportDetail(id);
  }

  @Patch('reports/:id/review')
  reviewReport(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewPlatformReportDto,
  ) {
    return this.moderationService.reviewReport(id, req.user.userId, dto);
  }

  @Get('logs')
  getLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 40;
    return this.moderationService.getLogs(Number.isFinite(parsedLimit) ? parsedLimit : 40);
  }
}
