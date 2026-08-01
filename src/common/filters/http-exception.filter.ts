import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    let message = 'Operation failed';
    let errors: any[] = [];

    // Format Class Validator Errors to match API Contract
    if (
      status === HttpStatus.BAD_REQUEST &&
      Array.isArray(exceptionResponse.message)
    ) {
      message = 'Validation failed';
      errors = exceptionResponse.message.map((msg: string) => ({
        field: msg.split(' ')[0], // Extracts field name roughly from Nest default strings
        message: msg,
      }));
    } else {
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exceptionResponse.message || exception.message;

      if (exceptionResponse.errors) {
        errors = exceptionResponse.errors;
      }
    }

    const errorResponse = {
      success: false,
      message,
      ...(errors.length > 0 && { errors }),
    };

    response.status(status).json(errorResponse);
  }
}
