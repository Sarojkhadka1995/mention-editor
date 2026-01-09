# Rich Text Mention Editor - Monorepo

A monorepo containing a Jira-like rich text comment editor with @mention support, built with React and TypeScript.

## Project Structure

```
.
├── app/                          # Demo Next.js application
├── components/                   # Demo app components
├── packages/
│   └── mention-editor/          # NPM package source
│       ├── src/
│       │   ├── mention-editor.tsx
│       │   ├── styles.css
│       │   └── index.ts
│       ├── package.json
│       └── README.md
├── package.json                 # Root package.json
└── README.md                    # This file
```

## Features

- **Rich Text Editing** - ContentEditable-based editor with HTML support
- **@Mention Support** - Type `@` to trigger user mention dropdown
- **Real-time Search** - Async search with debouncing
- **Keyboard Navigation** - Arrow keys, Enter, and Escape support
- **Customizable** - Configure mention link behavior, styling, and data fetching
- **TypeScript** - Full type safety and IDE support
- **Zero Dependencies** - Pure React with no external UI libraries

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

**Run the Demo App:**

```bash
npm run dev
```

This starts the Next.js demo application at `http://localhost:3000`, where you can test the mention editor with live examples.

**Work on the Package:**

```bash
cd packages/mention-editor
npm install
npm run dev
```

This runs the package in watch mode for development.

## Demo App

The demo app (`app/page.tsx`) shows how to use the mention editor with:

- JSONPlaceholder API integration for user data
- Pagination support
- Real-time search
- State management with `onChange`
- Form submission with `onSubmit`

## Package Development

### Building the Package

```bash
cd packages/mention-editor
npm run build
```

Outputs:

- `dist/index.js` - CommonJS build
- `dist/index.mjs` - ES Module build
- `dist/index.d.ts` - TypeScript declarations
- `dist/styles.css` - Standalone CSS

### Testing Locally

Test the package in the demo app using a local symlink:

```bash
cd packages/mention-editor
npm link

cd ../..
npm link @yourscope/mention-editor
```

### Publishing to NPM

1. **Update package name** in `packages/mention-editor/package.json`:

   ```json
   {
     "name": "@yourusername/mention-editor",
     "version": "1.0.0"
   }
   ```

2. **Build the package:**

   ```bash
   cd packages/mention-editor
   npm run build
   ```

3. **Login to npm:**

   ```bash
   npm login
   ```

4. **Publish:**

   ```bash
   npm publish --access public
   ```

5. **Update version for future releases:**
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

## Usage Example

After publishing, use the package in any React project:

```bash
npm install @yourusername/mention-editor
```

```tsx
import { MentionEditor } from "@yourusername/mention-editor";
import "@yourusername/mention-editor/dist/styles.css";

function App() {
  const [content, setContent] = useState("");

  const fetchUsers = async (query: string) => {
    const res = await fetch(`/api/users?search=${query}`);
    return res.json();
  };

  return (
    <MentionEditor
      fetchUsers={fetchUsers}
      onChange={setContent}
      onSubmit={(html) => console.log(html)}
    />
  );
}
```

## Scripts

**Root Level:**

- `npm run dev` - Start demo app in development mode
- `npm run build` - Build demo app for production

**Package Level:**

- `cd packages/mention-editor && npm run build` - Build the npm package
- `cd packages/mention-editor && npm run dev` - Watch mode for development

## Contributing

1. Make changes in `packages/mention-editor/src/`
2. Test in the demo app (`npm run dev`)
3. Build the package (`cd packages/mention-editor && npm run build`)
4. Update version and publish

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
