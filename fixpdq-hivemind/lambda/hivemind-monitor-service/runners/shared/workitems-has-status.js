import _ from "lodash";
import { services as fpdqServices } from "@fixpdq/common";

import { ACTION } from "../../../shared-common/services/state-definitions";
import { workitemService } from "../../../shared-common/services";
import * as rules from "../../rules";

import {
  HIVEMIND_LAMBDA,
  invokeLambda,
} from "../../../shared-common/utilities/lambda-util";

const { Engine } = require("json-rules-engine");
const { winstonLogger: Log } = fpdqServices.loggerService;

export const onRemindWorkitemHasStatus = async (status) => {
  const engine = new Engine();
  engine.addRule(rules.workitemHasStatus(status));

  const facts = await workitemService.getWorkitemsByStatus({
    status,
  });
  const workitemsToProcess = [];
  await Promise.all(
    facts.map(async (fact) => {
      await engine.run(fact).then(({ events }) => {
        events.forEach((ev) => {
          workitemsToProcess.push({
            workitemid: fact.workitemid,
            ownerid: fact.ownerid || fact.creatorid,
            messageFromRule: ev.params.message,
            actionSubType: ev.type,
          });
        });
      });
    })
  );

  const groupedByOwner = _.groupBy(workitemsToProcess, "ownerid");
  const ownerIds = Object.keys(groupedByOwner);

  Log.info(
    `RemindWorkitemHasStatus ${status}. Total number of work items: ${workitemsToProcess.length}`
  );

  const processActionList = ownerIds.map((ownerid) => {
    return {
      actionType: ACTION.HOUSEKEEPING,
      name: workitemsToProcess[0].actionSubType,
      activeFor: ownerid,
      payload: {
        workitems: groupedByOwner[ownerid].map(
          (workitem) => workitem.workitemid
        ),
      },
    };
  });

  await invokeLambda(HIVEMIND_LAMBDA, "processActionList", {
    actions: processActionList,
  });
};
