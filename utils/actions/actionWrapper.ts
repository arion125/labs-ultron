import { NoEnoughTokensToPerformLabsAction } from "../../common/errors";
import { NotificationMessage } from "../../common/notifications";
import { LabsAction } from "../../common/types";
import { sendNotification } from "./sendNotification";
import { wait } from "./wait";

// If a SAGE Labs action fails, send a notification and retry the same action every minute
export async function actionWrapper<R, A extends any[]>(
  func: LabsAction<R, A>,
  ...args: A
): Promise<R> {
  while (true) {
    try {
      return await func(...args);
    } catch (e) {
      if (e instanceof NoEnoughTokensToPerformLabsAction) throw e;
      console.error(`Action failed. Auto retry in 10 seconds. ${e}`);
      sendNotification(NotificationMessage.FAIL_WARNING);
      await wait(10);
    }
  }
}
