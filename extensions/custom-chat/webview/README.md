# Custom Chat Angular Webview

This directory contains the Angular application that serves as the webview interface for the Custom Chat VS Code extension.

## Structure

```
webview/
├── src/
│   ├── app/
│   │   ├── chat/           # Main chat component
│   │   ├── message/        # Individual message component
│   │   ├── input/          # Message input component
│   │   ├── header/         # Header with controls
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   ├── main.ts
│   ├── styles.scss
│   └── index.html
├── package.json
├── angular.json
├── tsconfig.json
└── README.md
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Angular CLI (installed globally or via npx)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build for development:
   ```bash
   npm run build:dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Watch for changes:
   ```bash
   npm run watch
   ```

### Features

- **VS Code Theme Integration**: Uses VS Code CSS variables for consistent theming
- **Real-time Streaming**: Supports streaming responses from the Conversational Analytics API
- **Markdown Support**: Basic markdown formatting for messages
- **Responsive Design**: Adapts to different VS Code themes (light, dark, high contrast)
- **TypeScript**: Full TypeScript support with strict type checking

### Components

- **AppComponent**: Root component that orchestrates the application
- **ChatComponent**: Main chat interface with message handling
- **MessageComponent**: Individual message display with markdown support
- **InputComponent**: Message input with keyboard shortcuts
- **HeaderComponent**: Header with title and control buttons

### Communication with VS Code Extension

The webview communicates with the VS Code extension using the `acquireVsCodeApi()` function:

```typescript
const vscode = acquireVsCodeApi();

// Send messages to extension
vscode.postMessage({
  command: 'sendMessage',
  text: 'Hello world'
});

// Receive messages from extension
window.addEventListener('message', event => {
  const message = event.data;
  // Handle message
});
```

### Build Output

The build output is placed in `../out/webview/` and includes:
- `index.html` - Main HTML file
- `runtime.js` - Angular runtime
- `polyfills.js` - Browser polyfills
- `main.js` - Application bundle
- `styles.css` - Compiled styles

### VS Code Integration

The webview is served by the VS Code extension and integrates with:
- VS Code authentication for Google Cloud
- Conversational Analytics API
- BigQuery data sources
- VS Code theme system

## Troubleshooting

### Build Issues

1. **Angular CLI not found**: Install globally with `npm install -g @angular/cli`
2. **TypeScript errors**: Ensure TypeScript version is compatible (5.2+)
3. **Dependency conflicts**: Clear node_modules and reinstall

### Runtime Issues

1. **Webview not loading**: Check that the build output exists in `../out/webview/`
2. **Communication errors**: Verify VS Code API is available in webview context
3. **Theme issues**: Check CSS variable definitions in `styles.scss`

### Development Tips

1. Use `npm run watch` for development to automatically rebuild on changes
2. Check the VS Code Developer Tools for webview debugging
3. Use the VS Code extension's console for backend debugging
4. Test with different VS Code themes to ensure compatibility 