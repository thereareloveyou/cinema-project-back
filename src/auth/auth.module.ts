import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtService } from '@nestjs/jwt'
import { UserService } from 'src/user/user.service'
import { PrismaService } from 'src/prisma.service'

@Module({
  providers: [AuthService, JwtService, PrismaService, UserService],
  controllers: [AuthController],
  imports: [ ],
})
export class AuthModule {}
