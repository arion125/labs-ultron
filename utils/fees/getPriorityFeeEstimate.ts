import { TransactionReturn } from "@staratlas/data-source";
import { heliusFeeUrl } from "../../common/constants";
import bs58 from "bs58";

type PriorityFeeData = {
  jsonrpc: string;
  result: {
    priorityFeeEstimate: number;
  };
  id: string;
}

export const getPriorityFeeEstimate = async (priorityLevel: string = "Medium", transaction: TransactionReturn) => {
  try {
    const response = await fetch(heliusFeeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getPriorityFeeEstimate",
        params: [
          {
            transaction: bs58.encode(transaction.transaction.serialize()),
            //accountKeys: ["SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6"],
            options: { priorityLevel: priorityLevel },
          },
        ],
      }),
    });
    const data = await response.json() as PriorityFeeData;

    return data.result;
  } catch (e) {
    return { priorityFeeEstimate: 0 }
  }
}