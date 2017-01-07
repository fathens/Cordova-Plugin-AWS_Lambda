import _ from "lodash";
import { Logger } from "log4ts";
import { aws_request } from "cordova-plugin-aws";

import { LambdaClient  } from "./lambda_client";
import { LambdaWebClient } from "./lambda_web_client";

const logger = new Logger("Lambda");

const plugin = (window as any).plugin;

function isDef(typedec) {
    return !_.isEqual(typedec, 'undefined');
}
const hasPlugin = isDef(typeof plugin) && isDef(typeof plugin.AWS) && isDef(typeof plugin.AWS.Cognito);

export class Lambda implements LambdaClient {
    constructor() {
        this.client = hasPlugin ? plugin.AWS.Lambda : new LambdaWebClient();
    }

    private readonly client: LambdaClient;

    async invoke<T, R>(func_name: string, args: T): Promise<R> {
        return this.client.invoke<T, R>(func_name, args);
    }
}