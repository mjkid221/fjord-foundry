# `packages/ui`

## Storybook with Next.js, TypeScript and React

This package combines Storybook, Next.js, TypeScript, and React to provide a powerful development environment for building UI components and pages. With the integration of these tools, you can efficiently create, showcase, and test your components in isolation before integrating them into your Next.js application.

See the Notion docs for more information on our [Frontend Standards](https://www.notion.so/labrys/Frontend-Standards-a5e92db8aecd46f5864802938b7a6505)

### Features

- Storybook: A development environment for UI components that allows you to browse, test, and document your components in isolation.
- Next.js: A popular framework for server-rendered React applications that provides a streamlined development experience and optimized performance.
- TypeScript: A statically-typed superset of JavaScript that enhances your development process by providing type checking and improved tooling support.
- React: A JavaScript library for building user interfaces that allows you to create reusable UI components.

## Usage

### Start Storybook:

```
yarn dev
```

or

```
yarn storybook
```

This command will start the Storybook development server and open a browser window displaying your components. You can now navigate through the components, view their variations, and interact with them in an isolated environment.

Develop your components:

- Create or modify your components in thisdirectory using React and TypeScript.
- Use Storybook's stories to showcase your components and their different states.

Integrate with Next.js:

- Once you are satisfied with your component's implementation and behavior in Storybook, you can integrate them into your Next.js application.
- Import the components from the Storybook package to your Next.js project and import them as required.

## Additional Resources

- Labrys Frontend Standards: https://www.notion.so/labrys/Frontend-Standards-a5e92db8aecd46f5864802938b7a6505
- Storybook documentation: https://storybook.js.org/docs
- Next.js documentation: https://nextjs.org/docs
- TypeScript documentation: https://www.typescriptlang.org/docs
- React documentation: https://reactjs.org/docs
