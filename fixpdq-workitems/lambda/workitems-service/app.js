/* eslint-disable quotes */
/* eslint-disable no-unsafe-finally */

import axios from "axios";
import jwt_decode from "jwt-decode";

import { workItemsModel } from "../common/models";

export async function handler(event, context) {
  let response;
  let result;

  console.log(JSON.stringify(event), JSON.stringify(context));

  try {
    if (
      !event.headers.Authorization ||
      !event.headers.Authorization.startsWith("Bearer ")
    )
      throw new Error("Unauthorized user");

    const userToken = jwt_decode(
      event.headers.Authorization.split("Bearer ")[1].trim()
    );
    const creatorid = userToken['username'];

    // // queryParams workitems/ and workitems/:workitemid
    if (event.httpMethod === "GET") {
      const items = await workItemsModel.getWorkItemsByCreatorId(creatorid);
      result = { items };
    }

    // @todo decode bearer and get username as creatorid
    if (event.httpMethod === "POST") {
      const newWorkItemData = await workItemsModel.createWorkItem(creatorid, JSON.parse(event.body));
      result = newWorkItemData;
    }

    // // queryParams = workitems/:workitemid
    if (event.httpMethod === "PUT") {
      const { workitemid } = event.pathParameters;
      const updatedWorkItemData = await workItemsModel.updateWorkItem(workitemid, JSON.parse(event.body));
      result = updatedWorkItemData;
    }

    response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
      },
      body: JSON.stringify({
        ...result,
      }),
    };
  } catch (e) {
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: "There was an error while processing workitems",
      }),
    };
  } finally {
    return response;
  }
}
