import { IsJWT, IsString } from 'class-validator';

export class ConfirmEmailDto {
  @IsString()
  @IsJWT()
  public confirmationToken!: string;
}
