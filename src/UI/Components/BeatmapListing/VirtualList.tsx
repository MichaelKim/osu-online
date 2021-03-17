import { Component, createRef } from 'react';
import OptionsContext from '../../options';
import VirtualListItem from './VirtualListItem';

type ObserverCallback = (visible: boolean) => void;

type Props = {
  items: {
    className?: string;
    height: number;
    key: React.Key;
    renderChild: () => React.ReactNode;
  }[];
};

type State = {
  offset: number;
};

// Functional comp requires way too many useCallbacks
export default class VirtualList extends Component<Props, State> {
  static contextType = OptionsContext;
  declare context: React.ContextType<typeof OptionsContext>;

  state = {
    offset: 0
  };

  // Intersection Observer
  private observer: IntersectionObserver | null = null;
  // List element -> observe callback
  private mapping = new Map<Element, ObserverCallback>();
  // Ref to main element
  private ref = createRef<HTMLDivElement>();

  componentDidMount() {
    this.observer = new IntersectionObserver(this.onObserve, {
      root: this.ref.current,
      rootMargin: '200px'
    });
  }

  componentWillUnmount() {
    this.observer?.disconnect();
  }

  onObserve = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      this.mapping.get(entry.target)?.(entry.isIntersecting);
    }
  };

  onScroll = ({ currentTarget: { scrollTop } }: React.UIEvent) => {
    this.setState({ offset: scrollTop });
  };

  onAttach = (el: Element, cb: ObserverCallback) => {
    if (!this.mapping.has(el)) {
      this.mapping.set(el, cb);
      this.observer?.observe(el);
    }
  };

  onDetach = (el: Element) => {
    this.mapping.delete(el);
    this.observer?.unobserve(el);
  };

  render() {
    const { items } = this.props;
    const { offset } = this.state;
    const { animations } = this.context;

    return (
      <div
        ref={this.ref}
        style={{
          flex: 1,
          overflowY: 'scroll'
        }}
        onScroll={animations ? this.onScroll : undefined}
      >
        {items.map(({ className, height, key, renderChild }) => (
          <VirtualListItem
            className={className}
            key={key}
            height={height}
            offset={offset}
            animations={animations}
            renderChild={renderChild}
            onAttach={this.onAttach}
            onDetach={this.onDetach}
          />
        ))}
      </div>
    );
  }
}
