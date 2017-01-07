import _ from "lodash";
import { Logger } from "log4ts";
import { aws_request } from "cordova-plugin-aws";

import { LambdaClient } from "./lambda_client";

const logger = new Logger("LambdaWebClient");

const AWS = (window as any).AWS;

type LambdaRequest<T> = {
    FunctionName: string,
    Payload: T,
    ClientContext?: string, // Base64 encoded JSON
    InvocationType?: "Event" | "RequestResponse" | "DryRun",
    LogType?: "None" | "Tail",
    Qualifier?: string
}

export class LambdaWebClient implements LambdaClient {
    async invoke<T, R>(func_name: string, args: T): Promise<R> {
        const names = func_name.split(':');

        const params: LambdaRequest<T> = {
            FunctionName: names[0],
            Payload: args
        };
        if (names.length > 1) params.Qualifier = names[1];

        const lambda = new AWS.Lambda();
        return aws_request<R>(lambda.invoke(params));
    }
}