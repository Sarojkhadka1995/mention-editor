# @khadkasaroj/mention-editor

A rich text editor component with @mention support for React applications. Built with TypeScript and styled with customizable CSS.

## Features

- 🎯 @mention support with dropdown suggestions
- ⌨️ Keyboard navigation (Arrow keys, Enter, Escape)
- 🔍 Real-time search and filtering
- 🎨 Customizable styling
- 📱 Fully accessible (ARIA compliant)
- 🚀 TypeScript support
- ⚡ Lightweight and performant
- 🔄 Async user fetching with debouncing
- 🔗 Customizable mention links and attributes

## Installation

```bash
npm install @khadkasaroj/mention-editor
# or
yarn add @khadkasaroj/mention-editor
# or
pnpm add @khadkasaroj/mention-editor
```

## Usage

```tsx
import { MentionEditor, User } from "@khadkasaroj/mention-editor";
import "@khadkasaroj/mention-editor/styles.css";

function MyComponent() {
  const fetchUsers = async (query: string): Promise<User[]> => {
    const response = await fetch(`/api/users?search=${query}`);
    return response.json();
  };

  const handleSubmit = (html: string) => {
    console.log("Submitted content:", html);
  };

  const handleChange = (html: string) => {
    console.log("Content changed:", html);
  };

  return (
    <MentionEditor
      fetchUsers={fetchUsers}
      onSubmit={handleSubmit}
      onChange={handleChange}
      placeholder="Add a comment..."
    />
  );
}
```

## API

### Props

| Prop            | Type                                 | Required | Description                                         |
| --------------- | ------------------------------------ | -------- | --------------------------------------------------- |
| `fetchUsers`    | `(query: string) => Promise<User[]>` | Yes      | Async function to fetch users based on search query |
| `onSubmit`      | `(html: string) => void`             | No       | Callback when submit button is clicked              |
| `onChange`      | `(html: string) => void`             | No       | Callback when content changes                       |
| `placeholder`   | `string`                             | No       | Placeholder text (default: "Add a comment...")      |
| `className`     | `string`                             | No       | Additional CSS class for the container              |
| `mentionConfig` | `MentionConfig`                      | No       | Configuration for mention anchor elements           |

### Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface MentionConfig {
  href?: (user: User) => string;
  className?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  dataAttributes?: Record<string, string>;
}

interface MentionEditorProps {
  fetchUsers: (query: string) => Promise<User[]>;
  onSubmit?: (html: string) => void;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  mentionConfig?: MentionConfig;
}
```

## Customizing Mention Links

You can customize how mention links are generated using the `mentionConfig` prop:

```tsx
<MentionEditor
  fetchUsers={fetchUsers}
  mentionConfig={{
    // Custom href generation
    href: (user) => `/profile/${user.id}`,
    // Custom CSS class
    className: "custom-mention",
    // Open in new tab
    target: "_blank",
    rel: "noopener noreferrer",
    // Add custom data attributes
    dataAttributes: {
      "mention-type": "user",
      "tracking-id": "mention-click",
    },
  }}
/>
```

This will generate mentions like:

```html
<a
  href="/profile/123"
  class="custom-mention"
  target="_blank"
  rel="noopener noreferrer"
  data-user-id="123"
  data-mention-type="user"
  data-tracking-id="mention-click"
  contenteditable="false"
>
  @John Doe
</a>
```

## Styling

The component comes with default styles that you must import:

```tsx
import "@khadkasaroj/mention-editor/styles.css";
```

You can customize the appearance by overriding the CSS classes:

- `.mention-editor-container` - Main container
- `.mention-editor` - The contenteditable div
- `.mention` - Mention tags (default class, can be customized)
- `.mention-dropdown` - Dropdown container
- `.mention-dropdown-item` - Individual dropdown items
- `.mention-editor-submit-btn` - Submit button

### Troubleshooting CSS Import

If you get a "Module not found" error when importing the CSS:

1. Make sure you've rebuilt the package: `npm run build`
2. Check that `dist/styles.css` exists in the package
3. Verify your package.json exports include:
   ```json
   "exports": {
     "./styles.css": "./dist/styles.css"
   }
   ```

## Example with JSONPlaceholder API

```tsx
import { MentionEditor, User } from "@khadkasaroj/mention-editor";
import "@khadkasaroj/mention-editor/styles.css";

function App() {
  const fetchUsers = async (query: string): Promise<User[]> => {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users?name_like=${query}`
    );
    const users = await response.json();
    return users.map((user: any) => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
    }));
  };

  return (
    <div className="container">
      <h1>Comment Editor</h1>
      <MentionEditor
        fetchUsers={fetchUsers}
        onSubmit={(html) => alert(`Submitted: ${html}`)}
        onChange={(html) => console.log("Changed:", html)}
        mentionConfig={{
          href: (user) => `https://example.com/users/${user.id}`,
          target: "_blank",
          rel: "noopener noreferrer",
        }}
      />
    </div>
  );
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
