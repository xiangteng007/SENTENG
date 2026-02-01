import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";

export const DEPRECATION_KEY = "deprecation";

/**
 * Decorator to mark an endpoint or controller as deprecated
 * @param message - The deprecation message with migration instructions
 * @param sunset - Optional sunset date when the endpoint will be removed
 */
export const Deprecated = (message: string, sunset?: string) =>
  SetMetadata(DEPRECATION_KEY, { message, sunset });

@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const deprecation = this.reflector.getAllAndOverride<{
      message: string;
      sunset?: string;
    }>(DEPRECATION_KEY, [context.getHandler(), context.getClass()]);

    if (deprecation) {
      const response = context.switchToHttp().getResponse();

      // Add standard deprecation headers
      response.setHeader("Deprecation", "true");
      response.setHeader("X-Deprecated", deprecation.message);

      if (deprecation.sunset) {
        response.setHeader("Sunset", deprecation.sunset);
      }

      // Add Link header pointing to the new API
      response.setHeader(
        "Link",
        '</api/v1/customers>; rel="successor-version"',
      );
    }

    return next.handle();
  }
}
