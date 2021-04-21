export interface IMiddleware {
    verify(): Promise<Boolean>;
    error(): string;
}