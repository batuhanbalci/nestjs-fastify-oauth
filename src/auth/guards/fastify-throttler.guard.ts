import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class FastifyThrottlerGuard extends ThrottlerGuard {
  public getRequestResponse(context: ExecutionContext) {
    const http = context.switchToHttp();
    return {
      req: http.getRequest<FastifyRequest>(),
      res: http.getResponse<FastifyReply>(),
    };
  }
}
