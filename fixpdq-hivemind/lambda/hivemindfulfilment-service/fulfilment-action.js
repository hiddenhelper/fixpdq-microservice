import {
  onWorkitemAccountabilityAccepted,
  onWorkitemReviewAccepted,
  onWorkitemReviewDeclined,
} from "./actions";

import { FULFILMENT_ACTION } from "./fulfilment-action-definition";

class FulfilmentAction {
  constructor() {
    this.actionHandlerHash = new Map();
    this.handlers = {
      onWorkitemAccountabilityAccepted,
      onWorkitemReviewAccepted,
      onWorkitemReviewDeclined,
    };
    this.populateActionHandlerHash();
    this.dispatch = (action, payload) => {
      return this.actionHandlerHash.get(action)(payload);
    };
  }

  populateActionHandlerHash() {
    Object.entries(FULFILMENT_ACTION).forEach(([, value]) => {
      this.actionHandlerHash.set(
        value,
        this.handlers[this.generateActionEventName(value)]
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  generateActionEventName(name) {
    return `on${name.charAt(0).toUpperCase()}${name.slice(1)}`.replace(
      new RegExp(/-[a-z]/g),
      (match) => {
        return match.toUpperCase().replace(new RegExp(/-/g), "");
      }
    );
  }
}

export const handleFulfilmentAction = async ({ name, payload }) => {
  try {
    await new FulfilmentAction().dispatch(name, payload);
    return {};
  } catch (err) {
    // eslint-disable-next-line no-throw-literal
    throw `Error when handling fulfilment ${err ? JSON.stringify(err) : ""}`;
  }
};
