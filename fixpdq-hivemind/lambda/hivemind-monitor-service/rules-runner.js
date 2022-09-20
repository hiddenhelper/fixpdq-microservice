import { configUtil } from "../shared-common/utilities";
import {
  onAccContractNumDaysOpen,
  onWorkitemNumDaysBeforeDue,
  onRemindWorkitemHasStatusNew,
  onRemindWorkitemHasStatusOnHold,
  onRemindWorkitemDueToday,
  onRemindWorkitemUnassigned,
} from "./runners";
import { RULES_RUNNER_PARALLELISM } from "./rules-runner-definitions";

const asyncBatch = require("async-batch").default;

const config = configUtil.getConfig();

const RULES_TO_RUN = Object.entries(config.rules)
  .filter(([, value]) => value !== "0")
  .filter(([, value]) => value !== "disabled")
  .map(([key]) => key);

class RulesRunner {
  constructor() {
    this.actionHandlerHash = new Map();
    this.handlers = {
      onAccContractNumDaysOpen,
      onWorkitemNumDaysBeforeDue,
      onRemindWorkitemHasStatusNew,
      onRemindWorkitemHasStatusOnHold,
      onRemindWorkitemDueToday,
      onRemindWorkitemUnassigned,
    };
    this.populateActionHandlerHash();
    this.dispatch = (rule, event) => {
      return this.actionHandlerHash.get(rule)(event);
    };
  }

  populateActionHandlerHash() {
    Object.entries(RULES_TO_RUN).forEach(([, value]) => {
      this.actionHandlerHash.set(
        RulesRunner.generateRuleName(value),
        this.handlers[RulesRunner.generateRuleName(value)]
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  static generateRuleName(nameInUppercase) {
    const name = nameInUppercase.toLowerCase();
    return `on${name.charAt(0).toUpperCase()}${name.slice(1)}`.replace(
      new RegExp(/\_[a-z]/g),
      (match) => {
        return match.toUpperCase().replace(new RegExp(/\_/g), "");
      }
    );
  }
}

export const processRules = async (event) => {
  const runOneRule = async (rule) => {
    await new RulesRunner().dispatch(RulesRunner.generateRuleName(rule), event);
  };
  try {
    await asyncBatch(RULES_TO_RUN, runOneRule, RULES_RUNNER_PARALLELISM);
    return {};
  } catch (err) {
    // eslint-disable-next-line no-throw-literal
    throw `Error when running rules ${err ? JSON.stringify(err) : ""}`;
  }
};
