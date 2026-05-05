const PREVIEW_SCROLLBAR_STYLE = `
<style>
  *::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background-color: rgba(99, 102, 241, 0.3);
    border-radius: 9999px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: #52525b;
  }

  *::-webkit-scrollbar-corner {
    background: transparent;
  }
</style>
`;

export function withPreviewStyles(html: string): string {
  if (html.includes('</head>')) {
    return html.replace('</head>', `${PREVIEW_SCROLLBAR_STYLE}</head>`);
  }

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/(<body[^>]*>)/i, `${PREVIEW_SCROLLBAR_STYLE}$1`);
  }

  return `${PREVIEW_SCROLLBAR_STYLE}${html}`;
}
