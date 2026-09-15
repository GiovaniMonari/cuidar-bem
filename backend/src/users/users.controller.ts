import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ClientsService } from '../clients/clients.service';
import * as bcrypt from 'bcryptjs';

function imageFileFilter(req: any, file: Express.Multer.File, callback: Function) {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return callback(
      new BadRequestException('Apenas imagens JPG, PNG ou WEBP são permitidas'),
      false,
    );
  }
  callback(null, true);
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly clientsService: ClientsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  @ApiBody({ type: UpdateUserDto })
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/dependents')
  @ApiOperation({ summary: 'Listar dependentes do usuário autenticado' })
  getDependents(@Request() req) {
    return this.clientsService.getDependents(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/dependents')
  @ApiOperation({ summary: 'Adicionar dependente' })
  addDependent(
    @Request() req,
    @Body() body: { name: string; age: number; disorder?: string; conditions?: string[]; notes?: string },
  ) {
    return this.clientsService.addDependent(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/dependents/:dependentId')
  @ApiOperation({ summary: 'Atualizar dependente' })
  updateDependent(
    @Request() req,
    @Param('dependentId') dependentId: string,
    @Body() body: { name: string; age: number; disorder?: string; conditions?: string[]; notes?: string },
  ) {
    return this.clientsService.updateDependent(req.user.userId, dependentId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/dependents/:dependentId/remove')
  @ApiOperation({ summary: 'Remover dependente' })
  removeDependent(@Request() req, @Param('dependentId') dependentId: string) {
    return this.clientsService.removeDependent(req.user.userId, dependentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/patient-profile')
  @ApiOperation({ summary: 'Obter perfil do usuário como paciente' })
  getPatientProfile(@Request() req) {
    return this.clientsService.getPatientProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/patient-profile')
  @ApiOperation({ summary: 'Atualizar perfil do usuário como paciente' })
  updatePatientProfile(
    @Request() req,
    @Body() body: { name: string; age: number; disorder?: string; notes?: string },
  ) {
    return this.clientsService.updatePatientProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/addresses')
  @ApiOperation({ summary: 'Listar endereços salvos do cliente' })
  getSavedAddresses(@Request() req) {
    return this.clientsService.getSavedAddresses(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/addresses')
  @ApiOperation({ summary: 'Salvar endereço validado do cliente' })
  addSavedAddress(@Request() req, @Body() body: Record<string, string>) {
    return this.clientsService.addSavedAddress(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/addresses/:addressId')
  @ApiOperation({ summary: 'Editar endereço salvo do cliente' })
  updateSavedAddress(@Request() req, @Param('addressId') addressId: string, @Body() body: Record<string, string>) {
    return this.clientsService.updateSavedAddress(req.user.userId, addressId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/addresses/:addressId/remove')
  @ApiOperation({ summary: 'Remover endereço salvo do cliente' })
  removeSavedAddress(@Request() req, @Param('addressId') addressId: string) {
    return this.clientsService.removeSavedAddress(req.user.userId, addressId);
  }

    @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @ApiOperation({ summary: 'Enviar avatar do usuário autenticado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary', description: 'Imagem JPG, PNG ou WEBP (máximo 5 MB)' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    // Buscar usuário atual com avatar antigo
    const currentUser = await this.usersService.findRawById(req.user.userId);

    // Upload da nova imagem
    const result: any = await this.cloudinaryService.uploadImage(file);

    // Apagar imagem antiga, se existir
    if (currentUser?.avatarPublicId) {
      try {
        await this.cloudinaryService.deleteImage(currentUser.avatarPublicId);
      } catch (error) {
        console.error('Erro ao remover avatar antigo do Cloudinary:');
      }
    }

    return this.usersService.update(req.user.userId, {
      avatar: result.secure_url,
      avatarPublicId: result.public_id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar/remove')
  @ApiOperation({ summary: 'Remover avatar do usuário autenticado' })
  async removeAvatar(@Request() req) {
    const currentUser = await this.usersService.findRawById(req.user.userId);

    if (!currentUser) {
      throw new BadRequestException('Usuário não encontrado');
    }

    if (currentUser.avatarPublicId) {
      try {
        await this.cloudinaryService.deleteImage(currentUser.avatarPublicId);
      } catch (error) {
        console.error('Erro ao remover avatar do Cloudinary:');
      }
    }

    return this.usersService.update(req.user.userId, {
      avatar: '',
      avatarPublicId: '',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/presence')
  @ApiOperation({ summary: 'Atualizar presença do usuário para online' })
  @HttpCode(HttpStatus.OK)
  async touchPresence(@Req() req: any) { // 👈 Corrigido para @Req()
    await this.usersService.touchPresence(req.user.userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/presence/offline')
  @ApiOperation({ summary: 'Marcar usuário como offline' })
  @HttpCode(HttpStatus.OK)
  async setOffline(@Req() req: any) { // 👈 Corrigido para @Req()
    await this.usersService.setOffline(req.user.userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/password')
  @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
  @ApiBody({ schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string', format: 'password' }, newPassword: { type: 'string', format: 'password', minLength: 8 } } } })
  async changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    const user = await this.usersService.findRawById(req.user.userId);
    if (!user) throw new BadRequestException('Usuário não encontrado');
    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Senha atual incorreta');
    return this.usersService.updatePassword(req.user.userId, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/favorite/:caregiverId')
  @ApiOperation({ summary: 'Adicionar ou alternar cuidador favorito' })
  @ApiParam({ name: 'caregiverId', description: 'ID do cuidador' })
  async toggleFavorite(
    @Request() req,
    @Param('caregiverId') caregiverId: string,
  ) {
    return this.clientsService.favoriteCaregiver(req.user.userId, caregiverId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites/caregivers')
  @ApiOperation({ summary: 'Listar cuidadores favoritos' })
  async getFavoriteCaregivers(@Request() req) {
    return this.clientsService.getFavoriteCaregivers(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/favorite/:caregiverId/remove')
  @ApiOperation({ summary: 'Remover cuidador dos favoritos' })
  @ApiParam({ name: 'caregiverId', description: 'ID do cuidador' })
  async removeFavoriteCaregiver(
    @Request() req,
    @Param('caregiverId') caregiverId: string,
  ) {
    return this.clientsService.deleteFavoriteCaregiver(req.user.userId, caregiverId);
  }
}
