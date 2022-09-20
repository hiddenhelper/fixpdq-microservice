import { services as fpdqServices } from "@fixpdq/common";
import { twilioService } from "../services";

const { winstonLogger: Log } = fpdqServices.loggerService;

export async function getTwilioToken(username) {
  try {
    const result = await twilioService.generateToken(username);
    return result;
  } catch (error) {
    Log.error(
      `[model] There was an error with 'getTwilioToken' ${error.message}`
    );
  }
}
