import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../utils/apiResponse';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      const errors = error.details.reduce((acc: any, err) => {
        acc[err.path[0]] = err.message;
        return acc;
      }, {});

      return ApiResponse.error(res, 'Validation Error', 400, errors);
    }

    req.body = value;
    next();
  };
};
