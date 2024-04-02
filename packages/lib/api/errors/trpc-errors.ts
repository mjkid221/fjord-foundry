import { TRPCError } from "@trpc/server";

export const UnauthorizedError = () =>
  new TRPCError({
    code: "UNAUTHORIZED",
    message: "This route requires the caller to be authenticated.",
  });

export const ForbiddenError = () =>
  new TRPCError({
    code: "FORBIDDEN",
    message: "The caller does not have valid permissions",
  });

export const NotFoundError = () =>
  new TRPCError({
    code: "NOT_FOUND",
    message: "The resource could not be found.",
  });

export const BadRequestError = (message: string) =>
  new TRPCError({
    code: "BAD_REQUEST",
    message,
  });
