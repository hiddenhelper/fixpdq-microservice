import _ from "lodash";
import { services as fpdqServices } from "@fixpdq/common";

import { ACTION } from "../../shared-common/services/state-definitions";
import { workitemService } from "../../shared-common/services";
import * as rules from "../rules";
import {
  HIVEMIND_LAMBDA,
  invokeLambda,
} from "../../shared-common/utilities/lambda-util";

const { Engine } = require("json-rules-engine");
const { winstonLogger: Log } = fpdqServices.loggerService;

export const onRemindWorkitemUnassigned = async (event) => {
  try {
    const engine = new Engine();
    engine.addRule(rules.remindWorkitemUnassigned());

    const workitems = await workitemService.getWorkitemsUnassigned();

    const facts = workitems
      .filter((fact) => fact.status)
      .map((fact) => {
        return fact.ownerid
          ? fact
          : {
              ...fact,
              ownerid: undefined,
            };
      });
    const workitemsToProcess = [];
    await Promise.all(
      facts.map(async (fact) => {
        await engine.run(fact).then(({ events }) => {
          events.forEach((ev) => {
            workitemsToProcess.push({
              workitemid: fact.workitemid,
              creatorid: fact.creatorid,
              actionSubType: ev.type,
            });
          });
        });
      })
    );

    const groupedByCreator = _.groupBy(workitemsToProcess, "creatorid");
    const creatorIds = Object.keys(groupedByCreator);

    Log.info(
      `RemindWorkitemUnassigned. Total number of work items: ${workitemsToProcess.length}`
    );

    const processActionList = creatorIds.map((creatorid) => {
      return {
        actionType: ACTION.HOUSEKEEPING,
        name: workitemsToProcess[0].actionSubType,
        activeFor: creatorid,
        payload: {
          workitems: groupedByCreator[creatorid].map(
            (workitem) => workitem.workitemid
          ),
        },
      };
    });
    await invokeLambda(HIVEMIND_LAMBDA, "processActionList", {
      actions: processActionList,
    });
  } catch (err) {
    throw `Error in onRemindWorkitemUnassigned: ${err}`;
  }
};
