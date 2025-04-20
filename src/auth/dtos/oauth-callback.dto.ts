import { IsString } from 'class-validator';
import { IOAuthCallbackQuery } from '../interfaces';

export abstract class OAuthCallbackDto implements IOAuthCallbackQuery {
  @IsString()
  public code: string;

  @IsString()
  public state: string;
}
