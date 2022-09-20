/* eslint-disable quotes */
/* eslint-disable no-unsafe-finally */
import { services as fpdqServices, models as fpdqModels } from "@fixpdq/common";
// import jwt_decode from "jwt-decode";
import { actionsModel } from "../common/models";
import handlers from "./handlers";

const { winstonLogger: Log } = fpdqServices.loggerService;
const { ACTION: WORKITEM_ACTION } = fpdqModels.workitemsState;

export async function handler(event, context) {
  let response;
  let result;

  const corsHeader = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };

  console.log(JSON.stringify(event), JSON.stringify(context));

  const newAction = async () => {
    const newActionData = await actionsModel.createAction(event.payload);
    result = newActionData;
  };

  try {
    if (event.action) {
      if (
        [WORKITEM_ACTION.REQUEST_REVIEW, WORKITEM_ACTION.ASSIGN].includes(
          event.action
        )
      ) {
        await newAction();
      }
      if (
        [
          WORKITEM_ACTION.APPROVE,
          WORKITEM_ACTION.REJECT,
          WORKITEM_ACTION.COMPLETE_ACCOUNTABILITY_CONTRACT,
          WORKITEM_ACTION.REJECT_ACCOUNTABILITY_CONTRACT,
        ].includes(event.action)
      ) {
        result = await handlers.updateAction(event);
      }
      if (event.action === "getLatestActions") {
        const items = await actionsModel.getLatestActions(event.payload.days);
        result = Object.entries(items).map(([, value]) => value);
      }
      if (event.action === "createAction") {
        await actionsModel.createAction(event.payload);
        result = {};
      }
      response = {
        statusCode: 200,
        body: JSON.stringify({
          ...result,
        }),
      };
    } else {
      if (
        !event.headers.Authorization ||
        !event.headers.Authorization.startsWith("Bearer ")
      ) {
        throw new Error("Unauthorized user");
      }

      // const userToken = jwt_decode(
      //   event.headers.Authorization.split("Bearer ")[1].trim()
      // );

      // const currentUser = userToken.username;

      // queryParams actions/ and actions/:actionid
      if (event.httpMethod === "GET") {
        result = await handlers.get(event);
      }

      // @todo decode bearer and get username as creatorid
      if (event.httpMethod === "POST") {
        result = await handlers.post(event);
      }

      // queryParams = actions/:actionid
      if (event.httpMethod === "PUT") {
        const { actionid } = event.pathParameters;
        Log.info("PUT /actions/{actionid}", actionid);
        result = { message: "It's working", actionid };
      }

      response = {
        statusCode: 200,
        headers: corsHeader,
        body: JSON.stringify({
          ...result,
        }),
      };
    }
  } catch (e) {
    Log.error("Error", e);
    response = {
      statusCode: 500,
      headers: corsHeader,
      body: JSON.stringify({
        errorCode: 500,
        message: e,
      }),
    };
  } finally {
    return response;
  }
}
