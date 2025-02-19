import { v4 } from 'uuid';
import { IMessageResponse } from '../interfaces';

export class MessageResponseMapper implements IMessageResponse {
  public id: string;
  public message: string;

  constructor(message: string) {
    this.id = v4();
    this.message = message;
  }
}
