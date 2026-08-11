import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002':
                    response.status(HttpStatus.CONFLICT).json({
                        statusCode: HttpStatus.CONFLICT,
                        message: 'A record with the provided value already exists.',
                        path: request.url,
                        timestamp: new Date().toISOString(),
                    });
                    return;

                case 'P2025':
                    response.status(HttpStatus.NOT_FOUND).json({
                        statusCode: HttpStatus.NOT_FOUND,
                        message: 'The requested resource was not found.',
                        path: request.url,
                        timestamp: new Date().toISOString(),
                    });
                    return;

                default:
                    this.logger.error(exception);

                    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Internal server error.',
                        path: request.url,
                        timestamp: new Date().toISOString(),
                    });
                    return;
            }
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            let message: string | string[];

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
                const responseMessage = (exceptionResponse as { message?: string | string[] }).message;

                message = responseMessage ?? exception.message;
            } else {
                message = exception.message;
            }

            response.status(status).json({
                statusCode: status,
                message,
                path: request.url,
                timestamp: new Date().toISOString(),
            });

            return;
        }

        this.logger.error(exception);

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error.',
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}