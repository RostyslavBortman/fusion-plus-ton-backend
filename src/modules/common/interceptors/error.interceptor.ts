import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
  code?: string;
  description?: string;
  stack?: string;
  details?: string | string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseData = this.extractResponseData(exception, request.url);

    this.logger.error({ ...responseData, cause: exception }, 'Error occurred while processing request');

    response.status(status).json(responseData);
  }

  private extractResponseData(exception: unknown, path: string): ErrorResponse {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return {
          statusCode: exception.getStatus(),
          message: response,
          timestamp: new Date().toISOString(),
          path,
        };
      }
      return {
        statusCode: exception.getStatus(),
        message: (response as { message: string }).message,
        code: (response as { code: string }).code,
        details: (response as { details: string | string[] }).details,
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception instanceof Error ? exception.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
