# Middleware

Contains middleware for next-connect handlers. These are contained separately from other API related files as middleware will often use database models which will cause issues if accidentally imported to the frontend.

## Example

```tsx
/**
 * An API route which requires a database connection, secret key auth, and caches the response
 */
export default apiHandler()
  .use(secretKeyAuth)
  .use(cache)
  .use(database)
  .get(async (req: NextApiRequest, res: NextApiResonse<SomeType>) => {...});
  .patch(async (req: NextApiRequest, res: NextApiResonse<SomeType>) => {...});
  .post(async (req: NextApiRequest, res: NextApiResonse<SomeType>) => {...});
```
