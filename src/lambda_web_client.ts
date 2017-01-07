import _ from "lodash";
import { Logger } from "log4ts";
import { aws_request } from "cordova-plugin-aws";

import { LambdaClient, LambdaInvoke } from "./lambda_client";

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
    async invoke<T, R>(param: LambdaInvoke<T>): Promise<R> {
        const params: LambdaRequest<T> = {
            FunctionName: param.func_name,
            Payload: param.args
        };
        if (param.func_version) params.Qualifier = param.func_version;

        const lambda = new AWS.Lambda();
        return aws_request<R>(lambda.invoke(params));
    }
}