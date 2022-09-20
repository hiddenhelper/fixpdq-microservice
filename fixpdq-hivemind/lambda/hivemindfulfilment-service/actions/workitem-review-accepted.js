import { acceptOrRejectWorkItem } from "./fulfilment";

export const onWorkitemReviewAccepted = async ({
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
