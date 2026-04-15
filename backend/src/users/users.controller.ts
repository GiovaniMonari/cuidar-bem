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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
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

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

    @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
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
  @Post('me/password')
  async changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    const user = await this.usersService.findRawById(req.user.userId);
    if (!user) throw new BadRequestException('Usuário não encontrado');
    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Senha atual incorreta');
    return this.usersService.updatePassword(req.user.userId, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/favorite/:caregiverId')
  async toggleFavorite(
    @Request() req,
    @Param('caregiverId') caregiverId: string,
  ) {
    return this.usersService.favoriteCaregiver(req.user.userId, caregiverId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites/caregivers')
  async getFavoriteCaregivers(@Request() req) {
    return this.usersService.getFavoriteCaregivers(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/favorite/:caregiverId/remove')
  async removeFavoriteCaregiver(
    @Request() req,
    @Param('caregiverId') caregiverId: string,
  ) {
    return this.usersService.deleteFavoriteCaregiver(req.user.userId, caregiverId);
  }
}