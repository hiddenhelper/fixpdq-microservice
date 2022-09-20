import { acceptOrRejectWorkItem } from "./fulfilment";

export const onWorkitemAccountabilityAccepted = async ({
  client,
  workItemId,
  conversationId,
  userId,
  Log,
}) => {
  const actionItem = "approve";
  await acceptOrRejectWorkItem({
    client,
    workItemId,
    conversationId,
    actionItem,
    userId,
    Log,
  });
};
