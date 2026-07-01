import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    request.requestId = request.requestId ?? randomUUID();

    return next.handle().pipe(
      map((data) => ({
        data,
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
