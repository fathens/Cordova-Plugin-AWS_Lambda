export interface LambdaClient {
    invoke<T, R>(func_name: string, args: T): Promise<R>;
}
