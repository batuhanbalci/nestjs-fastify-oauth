import { User } from '@prisma/client';
import { IAuthResponseUser } from '../interfaces';

export class AuthResponseUserMapper implements IAuthResponseUser {
  public id: number;
  public email: string;
  public createdAt: string;
  public updatedAt: string;

  constructor(values: IAuthResponseUser) {
    Object.assign(this, values);
  }

  public static map(user: User): AuthResponseUserMapper {
    return new AuthResponseUserMapper({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }
}
