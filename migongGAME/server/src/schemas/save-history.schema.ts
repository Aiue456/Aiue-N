import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ collection: 'saveHistory' })
export class SaveHistory extends Document {
  @Prop({ required: true }) userId: string
  @Prop({ default: 1 }) version: number
  @Prop({ type: Object, default: {} }) data: any
  @Prop({ default: Date.now }) createdAt: number
}

export const SaveHistorySchema = SchemaFactory.createForClass(SaveHistory)
