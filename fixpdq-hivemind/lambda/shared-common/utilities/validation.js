import { services as fpdqServices } from '@fixpdq/common';
const { cloudWatchLogger, winstonLogger: Log } = fpdqServices.loggerService;
import * as Joi from "joi";

export function validateInput(requestBody) {
  try {
    const regexRule = /^([\p{N}\p{L}A-Za-z0-9_\-']|([\p{N}\p{L}A-Za-z0-9_\-'][\p{L}\p{N}A-Za-z0-9_\-' ]{0,30}[\p{L}\p{N}A-Za-z0-9_\-']))$/u;
    const validationJoi = Joi.object({
      name: Joi.string().min(1).max(32).required().regex(regexRule),
      owner: Joi.string().required(),
      creator: Joi.string().required()
    });

    const isValid = validationJoi.validate(requestBody);
    if (isValid.error) {
      Log.error(`validation error: ${isValid.error}`);
      return false;
    }

    if (requestBody.name.indexOf('  ') >= 0) {
      Log.error(`Contiguous spaces not allowed.`);
      return false;
    }

    const trimmedValue = requestBody.name.trim();
    if (trimmedValue != requestBody.name) {
      Log.error(`Cannot start or end with space.`);
      return false;
    }

    return true;
  } catch (error) {
    const errorMsg = `[utilities] There was an error with 'validateInput' ${error.message}`;
    Log.error(errorMsg);
    throw(errorMsg);
  }
}
