import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

import { Preview } from '@/components/docs/preview';
import { PreviewFile } from '@/components/docs/preview-file';

function getImageSrc(src: unknown) {
  if (typeof src === 'string') return src;

  if (src && typeof src === 'object') {
    if ('default' in src && src.default && typeof src.default === 'object' && 'src' in src.default) {
      return String((src as { default: { src: unknown } }).default.src);
    }

    if ('src' in src) {
      return String((src as { src: unknown }).src);
    }
  }

  return '';
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // HTML `ref` attribute conflicts with `forwardRef`
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    Preview,
    PreviewFile,
    img: ({ src, alt, width, height, ...props }) => {
      const resolvedSrc = getImageSrc(src);

      return (
        <ImageZoom
          src={resolvedSrc}
          alt={alt}
          width={width}
          height={height}
          zoomInProps={{ alt }}
        >
          <img src={resolvedSrc} alt={alt} width={width} height={height} {...props} />
        </ImageZoom>
      );
    },
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
