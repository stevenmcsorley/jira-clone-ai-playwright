import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { AdminGuard } from '../auth/guards/admin.guard'
import { User } from './entities/user.entity'

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    // New users are added to the creator's current workspace
    return this.usersService.create(createUserDto, req.workspaceId)
  }

  @Get()
  findAll(@Req() req: any) {
    return this.usersService.findByWorkspace(req.workspaceId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<User>, @Req() req: any) {
    const isSelf = req.user?.id === +id
    const isAdmin = req.user?.role === 'admin'
    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only edit your own profile')
    }
    // Only admins may change roles
    if (updateData.role && !isAdmin) {
      delete updateData.role
    }
    return this.usersService.update(+id, updateData)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id)
  }
}
