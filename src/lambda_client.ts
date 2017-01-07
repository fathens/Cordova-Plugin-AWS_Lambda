export type LambdaInvoke<T> = {
    func_name: string,
    func_version?: string,
    args: T
}

export interface LambdaClient {
    invoke<T, R>(param: LambdaInvoke<T>): Promise<R>;
}
