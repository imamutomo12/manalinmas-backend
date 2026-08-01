import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GlobalResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  GlobalResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<GlobalResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If the controller manually formats the response, return as is
        if (res && res.success !== undefined && res.message !== undefined) {
          return res;
        }

        // Auto-wrap response based on API Contract
        return {
          success: true,
          message: 'Operation successful',
          data: res || {},
        };
      }),
    );
  }
}
