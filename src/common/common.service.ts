import { Injectable } from '@nestjs/common';
import { MessageResponseMapper } from './mappers';

@Injectable()
export class CommonService {
  public generateMessageResponse(message: string): MessageResponseMapper {
    return new MessageResponseMapper(message);
  }
}
