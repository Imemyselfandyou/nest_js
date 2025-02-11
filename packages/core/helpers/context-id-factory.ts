import { ContextId, HostComponentInfo } from '../injector/instance-wrapper';
import { REQUEST_CONTEXT_ID } from '../router/request/request-constants';

export function createContextId(): ContextId {
  /**
   * We are generating random identifier to track asynchronous
   * execution context. An identifier does not have to be neither unique
   * nor unpredictable because WeakMap uses objects as keys (reference comparison).
   * Thus, even though identifier number might be equal, WeakMap would properly
   * associate asynchronous context with its internal map values using object reference.
   * Object is automatically removed once request has been processed (closure).
   */
  return { id: Math.random() };
}

export interface ContextIdStrategy<T = any> {
  /**
   * Allows to attach a parent context id to the existing child context id.
   * This lets you construct durable DI sub-trees that can be shared between contexts.
   * @param contextId auto-generated child context id
   * @param request request object
   * @returns a context id resolver function
   */
  attach(
    contextId: ContextId,
    request: T,
  ): ((info: HostComponentInfo) => ContextId) | undefined;
}

export class ContextIdFactory {
  private static strategy?: ContextIdStrategy;

  /**
   * Generates a context identifier based on the request object.
   */
  public static create(): ContextId {
    return createContextId();
  }

  /**
   * Generates a random identifier to track asynchronous execution context.
   * @param request request object
   */
  public static getByRequest<T extends Record<any, any> = any>(
    request: T,
    propsToInspect: string[] = ['raw'],
  ): ContextId {
    if (!request) {
      return ContextIdFactory.create();
    }
    if (request[REQUEST_CONTEXT_ID as any]) {
      return request[REQUEST_CONTEXT_ID as any];
    }
    for (const key of propsToInspect) {
      if (request[key]?.[REQUEST_CONTEXT_ID]) {
        return request[key][REQUEST_CONTEXT_ID];
      }
    }
    if (!this.strategy) {
      return ContextIdFactory.create();
    }
    const contextId = createContextId();
    contextId.getParent = this.strategy.attach(contextId, request);
    return contextId;
  }

  /**
   * Registers a custom context id strategy that lets you attach
   * a parent context id to the existing context id object.
   * @param strategy strategy instance
   */
  public static apply(strategy: ContextIdStrategy) {
    this.strategy = strategy;
  }
}
