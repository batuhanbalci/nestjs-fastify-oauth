import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthProvider, OAuthProviderEnum, User } from '@prisma/client';
import * as argon from 'argon2';
import { IOAuthProvider } from 'src/auth/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  public async create(
    provider: OAuthProviderEnum,
    email: string,
    firstName: string,
    lastName: string,
    password?: string,
  ): Promise<User> {
    const isConfirmed = provider !== OAuthProviderEnum.LOCAL;
    const formattedEmail = email.toLowerCase();
    await this.checkEmailUniqueness(formattedEmail);
    const user = await this.prisma.user.create({
      data: {
        email: formattedEmail,
        firstName: firstName,
        lastName: lastName,
        password: password ? await argon.hash(password) : 'UNSET',
        confirmed: isConfirmed,
      },
    });
    await this.createOAuthProvider(provider, user.id);
    return user;
  }

  public async findOneByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  public async confirmEmail(userId: number): Promise<User> {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        confirmed: true,
      },
    });
    return user;
  }

  public async findOneById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new UnauthorizedException('User not found!');
    }

    return user;
  }

  public async updatePassword(
    userId: number,
    newPassword: string,
    password?: string,
  ): Promise<User> {
    const user = await this.findOneById(userId);

    if (user.password === 'UNSET') {
      await this.createOAuthProvider(OAuthProviderEnum.LOCAL, user.id);
    } else {
      if (!password) {
        throw new BadRequestException('Password is required');
      }
      if (!(await argon.verify(user.password, password))) {
        throw new BadRequestException('Wrong password');
      }
      if (await argon.verify(user.password, newPassword)) {
        throw new BadRequestException('New password must be different');
      }
    }

    return await this.changePassword(user, newPassword);
  }

  public async resetPassword(
    userId: number,
    confirmed: boolean,
    password: string,
  ): Promise<User> {
    const user = await this.findOneByCredentials(userId, confirmed);
    return await this.changePassword(user, password);
  }

  public async findOneByCredentials(
    id: number,
    isConfirmed: boolean,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.confirmed !== isConfirmed) {
      throw new UnauthorizedException('Email not confirmed');
    }

    return user;
  }

  public async findOrCreateForOAuth(
    provider: OAuthProviderEnum,
    email: string,
    firstName?: string,
    lastName?: string,
  ) {
    const formattedEmail = email.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: formattedEmail,
      },
      include: {
        OAuthProvider: true,
      },
    });

    if (!user) {
      if (!firstName || !lastName) {
        throw new BadRequestException('First name and last name are required');
      }
      return this.create(provider, formattedEmail, email, firstName, lastName);
    }
    if (!user.OAuthProvider.find((p) => p.provider === provider)) {
      await this.createOAuthProvider(provider, user.id);
    }

    return user;
  }

  public async uncheckedUserByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found!');
    }

    return user;
  }

  public async findOAuthProviders(userId: number): Promise<IOAuthProvider[]> {
    return await this.prisma.oAuthProvider.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        provider: 'asc',
      },
      select: {
        provider: true,
        user: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async changePassword(user: User, password: string): Promise<User> {
    const hashedPassword = await argon.hash(password);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    return updatedUser;
  }

  private async createOAuthProvider(
    provider: OAuthProviderEnum,
    userId: number,
  ): Promise<OAuthProvider> {
    const oauthProvider = await this.prisma.oAuthProvider.create({
      data: {
        provider,
        userId,
      },
    });
    return oauthProvider;
  }

  private async checkEmailUniqueness(email: string): Promise<void> {
    const count = await this.prisma.user.count({ where: { email } });

    if (count > 0) {
      throw new ConflictException('Email already in use');
    }
  }
}
