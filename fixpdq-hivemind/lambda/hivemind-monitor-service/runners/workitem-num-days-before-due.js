const { Engine } = require("json-rules-engine");

import { services as fpdqServices } from "@fixpdq/common";
import { twilioService, workitemService } from "../../shared-common/services";
import { configUtil } from "../../shared-common/utilities";
import { workitemNumDaysBeforeDue } from "../rules";
import { RULE_PARALLELISM } from "../rules-runner-definitions";

const asyncBatch = require("async-batch").default;

const config = configUtil.getConfig();
const { winstonLogger: Log } = fpdqServices.loggerService;

export const onWorkitemNumDaysBeforeDue = async (event) => {
  try {
    const timerTimestamp = new Date(event.time).getTime();
    const engine = new Engine();
    engine.addRule(workitemNumDaysBeforeDue(timerTimestamp));

    const facts = await workitemService.getWorkitemsBeforeDue({
      days: config.rules.WORKITEM_NUM_DAYS_BEFORE_DUE,
    });
    const workitemsToProcess = [];
    await Promise.all(
      facts.map(async (fact) => {
        await engine.run(fact).then(({ events }) => {
          events.forEach((ev) => {
            workitemsToProcess.push({
              workitemid: fact.workitemid,
              ownerid: fact.ownerid,
              creatorid: fact.creatorid,
              topic: ev.params.topic,
              text: ev.params.text,
            });
          });
        });
      })
    );
    let counter = 0;
    const sendNotification = async (workitem) => {
      Log.info(
        `Processing work item: ${JSON.stringify(
          workitem
        )} counter: ${counter} workitemsToProcess.length: ${
          workitemsToProcess.length
        }`
      );
      await twilioService.notifyWorkitemBeforeDueDate(workitem);
      counter += 1;
    };
    await asyncBatch(workitemsToProcess, sendNotification, RULE_PARALLELISM);
  } catch (err) {
    throw `Error in onWorkitemNumDaysBeforeDue: ${err}`;
  }
};
