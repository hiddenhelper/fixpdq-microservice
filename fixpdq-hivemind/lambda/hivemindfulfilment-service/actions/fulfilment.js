import { updateWorkitem } from "../../shared-common/services/workitem-service";

export const acceptOrRejectWorkItem = async ({
  client,
  workItemId,
  conversationId,
  actionItem,
  userId,
  logger,
}) => {
  await updateWorkitem({ client, workItemId, conversationId, actionItem });
};
