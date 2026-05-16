import { useState } from 'react';

/**
 * Lazy image với blur placeholder.
 *
 * - loading="lazy": browser tự defer load đến khi gần viewport (native)
 * - Blur placeholder shimmer hiển thị trong khi tải
 * - Fade-in mượt khi image loaded
 *
 * Production sẽ thay placeholder bằng "blurhash" (mini base64 ảnh từ server) —
 * nhưng cần backend support. Placeholder shimmer này là fallback đơn giản.
 */
export default function LazyImage({ src, alt = '', className, style, ...rest }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`lazy-image ${className ?? ''}`} style={style}>
      {!loaded && <div className="blur-placeholder" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={loaded ? 'loaded' : ''}
        onLoad={() => setLoaded(true)}
        {...rest}
      />
    </div>
  );
}
