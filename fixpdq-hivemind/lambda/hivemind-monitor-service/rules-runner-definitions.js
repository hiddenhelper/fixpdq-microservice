import { configUtil } from "../shared-common/utilities";

const config = configUtil.getConfig();

export const RULES_RUNNER_PARALLELISM = config.RULES_RUNNER_PARALLELISM;
export const RULE_PARALLELISM = config.RULE_PARALLELISM;
