import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  // Initialize the built-in NestJS Logger with a context of 'HTTP'
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Listen for the 'finish' event on the response to log the final status code
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || 0;
      const duration = Date.now() - startTime;

      // Format: GET /api/v1/auth/login 200 512b - PostmanRuntime/7.32.3 ::1 [45ms]
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength}b - ${userAgent} ${ip} [${duration}ms]`,
      );
    });

    // Pass control to the next middleware or controller
    next();
  }
}
