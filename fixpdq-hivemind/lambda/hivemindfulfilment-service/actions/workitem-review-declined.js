import { acceptOrRejectWorkItem } from "./fulfilment";

export const onWorkitemReviewDeclined = async ({
  client,
  workItemId,
  conversationId,
  userId,
  Log,
}) => {
  const actionItem = "reject";
  await acceptOrRejectWorkItem({
    client,
    workItemId,
    conversationId,
    actionItem,
    userId,
    Log,
  });
};
