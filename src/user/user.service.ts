import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { InjectModel } from 'nestjs-typegoose'
import { UserModel } from './user.model'
import { UpdateUserDto } from './dto/update-user.dto'
import { genSalt } from 'bcryptjs'
import { hash } from 'crypto'
import { Types } from 'mongoose'

@Injectable()
export class UserService {
  constructor(@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>) {}

  async byId(_id: string) {
    const user = await this.UserModel.findById(_id)

    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async updateProfile(_id: string, dto: UpdateUserDto) {
    const user = await this.byId(_id)
    const isSameUser = await this.UserModel.findOne({ email: dto.email })

    if (isSameUser && String(_id) !== String(isSameUser._id)) throw new NotFoundException('Email busy')

    if (dto.password) {
      const salt = await genSalt(5)
      user.password = await hash(dto.password, salt)
    }

    user.email = dto.email
    if (dto.idAdmin || dto.idAdmin == false) user.isAdmin = dto.idAdmin

    await user.save()
    return
  }

  async getCount() {
    return (await this.UserModel.find().exec()).length
  }

  async getAllUsers(searchTerm?: string) {
    let options = {}

    if (searchTerm)
      options = {
        $or: [{ email: new RegExp(searchTerm, 'i') }],
      }

    return this.UserModel.find(options).select('-password -updatedAt -__v').sort({ createdAt: 'desc' }).exec()
  }

  async delete(id: string) {
    return this.UserModel.findByIdAndDelete(id).exec()
  }

  async toggleFavorite(movieId: Types.ObjectId, user: UserModel) {
    const { _id, favorites } = user

     await this.UserModel.findByIdAndUpdate(_id, {
      favorites: favorites.includes(movieId)
        ? favorites.filter((id) => String(id) !== String(movieId))
        : [...favorites, movieId],
    })
  }

  async getFavoriteMovies(_id: Types.ObjectId) {
    return await this.UserModel.findById(_id, 'favorites')
      .populate({ path: 'favorites', populate: { path: 'genres' } })
      .exec()
      .then((data) => data.favorites)
  }
}
