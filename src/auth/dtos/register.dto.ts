import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { NAME_REGEX } from 'src/common/consts';
import { PasswordsDto } from './passwords.dto';

export abstract class RegisterDto extends PasswordsDto {
  @IsString()
  @Length(3, 100, {
    message: 'Name has to be between 3 and 100 characters.',
  })
  @Matches(NAME_REGEX, {
    message: 'Name can only contain letters, dtos, numbers and spaces.',
  })
  public name!: string;

  @IsString()
  @IsEmail()
  @Length(5, 255)
  public email!: string;
}
