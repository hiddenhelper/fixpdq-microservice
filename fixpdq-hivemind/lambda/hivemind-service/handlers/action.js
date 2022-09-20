import { actionService } from "../../shared-common/services";
import { ACTION } from "../../shared-common/services/state-definitions";
import { createConversationForAction } from "./create-converstion";

const actionsList = Object.values(ACTION);

export const action = async (event) => {
  if (actionsList.includes(event.action)) {
    const conversationSid = await createConversationForAction({
      action: event.action,
      payload: event.payload,
    });
    return { conversationSid };
  }
  if (event.action === "createAction") {
    await actionService.createAction(event.payload);
    return {};
  }
  if (event.action === "processActionList") {
    await actionService.processActionList(event.payload);
    return {};
  }
  throw `Unknown action: ${event.action}`;
};
