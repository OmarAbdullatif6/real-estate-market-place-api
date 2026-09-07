import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { UserRole } from '../types/userRole.type';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false, trim: true, unique: true })
  phoneNumber: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.BUYER })
  role: UserRole;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Listing' }],
    default: [],
  })
  favorites: Types.ObjectId[];

  @Prop({ type: String, default: null })
  resetPasswordToken?: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires?: Date | null;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
