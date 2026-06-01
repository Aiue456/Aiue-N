import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ collection: 'users' })
export class User extends Document {
  @Prop({ required: true }) username: string
  @Prop({ required: true, unique: true }) account: string
  @Prop({ required: true }) password: string
  @Prop({ default: '' }) avatar: string
  @Prop({ default: Date.now }) createdAt: number
  @Prop({ default: Date.now }) lastLoginAt: number
  @Prop({ default: false }) isGuest: boolean
  @Prop({ default: function() { return Date.now() } }) lastActiveAt: number
}

export const UserSchema = SchemaFactory.createForClass(User)
