import { IAccessPayload } from './access-token.interface';
import { ITokenBase } from './token-base.interface';

export interface IEmailPayload extends IAccessPayload {
  confirmed: boolean;
}

export interface IEmailToken extends IEmailPayload, ITokenBase {}
