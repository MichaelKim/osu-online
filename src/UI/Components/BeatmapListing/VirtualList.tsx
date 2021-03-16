import { memo, useCallback, useRef, useState } from 'react';

type Props = {
  items: {
    renderChild: () => JSX.Element;
    height: number;
    key: React.Key;
  }[];
};

const useCallbackRef = <T extends HTMLElement>(
  attach: (el: T) => void,
  detach: (el: T) => void
) => {
  const ref = useRef<T | null>(null);
  const cb = useCallback(
    (el: T | null) => {
      if (ref.current) detach(ref.current);
      if (el) attach(el);
      ref.current = el;
    },
    [attach, detach]
  );

  return cb;
};

type ObserverCallback = (visible: boolean) => void;

type ItemProps = {
  height: number;
  renderChild: () => JSX.Element;
  onAttach: (el: Element, cb: ObserverCallback) => void;
  onDetach: (el: Element) => void;
};

function Item({ height, renderChild, onAttach, onDetach }: ItemProps) {
  const [visible, setVisible] = useState(false);
  const attach = useCallback(el => onAttach(el, setVisible), [onAttach]);
  const ref = useCallbackRef(attach, onDetach);

  return (
    <div ref={ref} style={{ height }}>
      {visible && renderChild()}
    </div>
  );
}

function VirtualList({ items }: Props) {
  const observer = useRef<IntersectionObserver>();
  const mapping = useRef(new Map<Element, ObserverCallback>());

  const raf = useRef(0);

  const attach = useCallback(el => {
    observer.current = new IntersectionObserver(
      entries => {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          for (const entry of entries) {
            mapping.current.get(entry.target)?.(entry.isIntersecting);
          }
        });
      },
      {
        root: el,
        rootMargin: '200px'
      }
    );
  }, []);
  const detach = useCallback(() => observer.current?.disconnect(), []);
  const ref = useCallbackRef<HTMLDivElement>(attach, detach);

  const onAttach = useCallback((el: Element, cb: ObserverCallback) => {
    if (!mapping.current.has(el)) {
      mapping.current.set(el, cb);
      observer.current?.observe(el);
    }
  }, []);

  const onDetach = useCallback((el: Element) => {
    mapping.current.delete(el);
    observer.current?.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        overflowY: 'scroll'
      }}
    >
      {items.map(({ renderChild, height, key }) => (
        <Item
          key={key}
          height={height}
          onAttach={onAttach}
          onDetach={onDetach}
          renderChild={renderChild}
        />
      ))}
    </div>
  );
}

export default memo(VirtualList);
