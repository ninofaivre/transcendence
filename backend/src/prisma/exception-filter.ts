
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    switch (exception.code) {
        case 'P2002': {
            response
                .status(409)
                .json({
                    code: "PrismaConflictAlreadyExistingEntity",
                    message: "Prisma tried to insert an entity that already exist, causing a conflict"
                })
            break ;
        }
        case 'P2025': {
            response
                .status(404)
                .json({
                    code: "PrismaNotFoundEntity",
                    message: "Prisma failed to found an entity"
                })
            break ;
        }
        default: {
            super.catch(exception, host)
            break ;
        }
    }
  }
}
