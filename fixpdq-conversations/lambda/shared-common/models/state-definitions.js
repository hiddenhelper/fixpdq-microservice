import { models } from "@fixpdq/common";

export const { STATUS } = models.workitemsState;
export const { ACTION } = models.workitemsState;
export const { TRANSITIONS } = models.workitemsState;

export const ACTION_ARRAY = Object.entries(ACTION).map(([, value]) => value);
