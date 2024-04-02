/**
 * HttpError is a custom error class that can be used to throw errors with a
 * status code. This is useful for throwing errors in API routes that can be
 * caught by the API route handler and used to set the status code of the
 * response.
 *
 * This is automatically handled by the `baseHandlerFactory` in "./handlerFactories.ts".
 *
 * @example
 *
 * import { HttpError } from '../utils/HttpError'
 *
 * export default async (req, res) => {
 *   const thing = await getThing()
 *
 *   if (!thing) {
 *     throw new HttpError(500, 'Internal Server Error')
 *   }
 *
 *  res.status(200).json(thing)
 * }
 *
 */
export class HttpError extends Error {
    public statusCode!: number;
  
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  