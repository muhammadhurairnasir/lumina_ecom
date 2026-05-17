import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200, pagination?: any) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(pagination && { pagination }),
    });
  }

  static created(res: Response, data: any, message: string = 'Created') {
    return this.success(res, data, message, 201);
  }

  static error(res: Response, message: string = 'Error', statusCode: number = 400, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }
}
