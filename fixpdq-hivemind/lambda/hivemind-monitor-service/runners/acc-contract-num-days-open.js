const { Engine } = require("json-rules-engine");

import { services as fpdqServices } from "@fixpdq/common";
import { getActions } from "../../shared-common/services/action-service.";
import { accContractNumDaysOpen } from "../rules";
import { twilioService } from "../../shared-common/services";
import { configUtil } from "../../shared-common/utilities";
import { RULE_PARALLELISM } from "../rules-runner-definitions";

const asyncBatch = require("async-batch").default;

const config = configUtil.getConfig();
const { winstonLogger: Log } = fpdqServices.loggerService;

export const onAccContractNumDaysOpen = async (event) => {
  try {
    const timerTimestamp = new Date(event.time).getTime();
    const engine = new Engine();

    engine.addRule(accContractNumDaysOpen(timerTimestamp));

    const facts = await getActions({
      days: config.rules.ACC_CONTRACT_NUM_DAYS_OPEN,
    });

    const actionsToProcess = [];
    await Promise.all(
      facts
        .filter((fact) => fact.actionType)
        .map(async (fact) => {
          await engine.run(fact).then(({ events }) => {
            events.forEach((ev) => {
              actionsToProcess.push({
                actionid: fact.actionid,
                dateCreated: fact.date_created,
                actionType: fact.actionType,
                conversationId: fact.conversationId,
                messageFromRule: ev.params.message,
              });
            });
          });
        })
    );
    let counter = 0;

    const sendNotification = async (action) => {
      Log.info(
        `Processing action: ${JSON.stringify(
          action
        )} counter: ${counter} actionsToProcess.length: ${
          actionsToProcess.length
        }`
      );
      counter += 1;
      await twilioService.notifyAccContractOpen(action);
    };

    await asyncBatch(actionsToProcess, sendNotification, RULE_PARALLELISM);
  } catch (err) {
    throw `Error in onAccContractNumDaysOpen: ${err}`;
  }
};
