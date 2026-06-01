import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ collection: 'achievements' })
export class Achievement extends Document {
  @Prop({ required: true, unique: true }) id: string
  @Prop({ required: true }) name: string
  @Prop({ default: '' }) description: string
  @Prop({ default: '🏅' }) icon: string
  @Prop({ type: Object, default: {} }) condition: Record<string, any>
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement)
