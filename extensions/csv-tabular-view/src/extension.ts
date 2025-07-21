// Built by Google
import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'bqdev.csvTabularEditor',
      new CsvTabularEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );
}

class CsvTabularEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true
    };
    const updateWebview = () => {
      webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
    };
    updateWebview();
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
    webviewPanel.webview.onDidReceiveMessage(message => {
      if (message.type === 'ready') {
        const csvText = document.getText();
        webviewPanel.webview.postMessage({
          type: 'csvData',
          csv: csvText
        });
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const angularDistPath = vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist', 'webview-ui', 'browser');
    const indexHtmlPath = vscode.Uri.joinPath(angularDistPath, 'index.html');
    let html = fs.readFileSync(indexHtmlPath.fsPath, 'utf8');

    // Replace asset paths with webview URIs
    html = html.replace(/(src|href)=\"(.+?)\"/g, (match: string, attr: string, src: string) => {
      if (src.startsWith('http') || src.startsWith('//')) return match;
      const assetUri = webview.asWebviewUri(vscode.Uri.joinPath(angularDistPath, src));
      return `${attr}=\"${assetUri}\"`;
    });

    return html;
  }
}

export function deactivate() {}
