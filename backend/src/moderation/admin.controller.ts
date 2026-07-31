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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ModerationService } from './moderation.service';
import { ReviewPlatformReportDto } from './dto/review-platform-report.dto';
import { UpdateUserModerationDto } from './dto/update-user-moderation.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter dashboard administrativo' })
  getDashboard() {
    return this.moderationService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários para moderação' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<any> {
    return this.moderationService.listUsers(search, role, status);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Detalhar usuário administrativo' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  getUserDetail(@Param('id') id: string) {
    return this.moderationService.getUserDetail(id);
  }

  @Patch('users/:id/moderation')
  @ApiOperation({ summary: 'Atualizar moderação de um usuário' })
  @ApiBody({ type: UpdateUserModerationDto })
  updateUserModeration(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateUserModerationDto,
  ) {
    return this.moderationService.updateUserModeration(id, req.user.userId, dto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Listar denúncias do sistema' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, type: String })
  listReports(@Query('status') status?: string, @Query('source') source?: string) {
    return this.moderationService.listReports(status, source);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Detalhar denúncia' })
  @ApiParam({ name: 'id', description: 'ID da denúncia' })
  getReportDetail(@Param('id') id: string) {
    return this.moderationService.getReportDetail(id);
  }

  @Patch('reports/:id/review')
  @ApiOperation({ summary: 'Revisar denúncia reportada' })
  @ApiBody({ type: ReviewPlatformReportDto })
  reviewReport(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewPlatformReportDto,
  ) {
    return this.moderationService.reviewReport(id, req.user.userId, dto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Listar últimos logs do admin' })
  @ApiQuery({ name: 'limit', required: false, type: String })
  getLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 40;
    return this.moderationService.getLogs(Number.isFinite(parsedLimit) ? parsedLimit : 40);
  }
}
