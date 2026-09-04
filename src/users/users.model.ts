import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false, trim: true })
  phoneNumber: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.BUYER })
  role: UserRole;

  @Prop({ default: false })
  isSubscribed: boolean;

  @Prop({ type: Date, default: null })
  subscriptionExpiresAt: Date | null;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Listing' }],
    default: [],
  })
  favorites: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);