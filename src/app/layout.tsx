import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dz-body">
        <RootProvider>
          <main className="dz-main">{children}</main>
        </RootProvider>
      </body>
    </html>
  );
}
