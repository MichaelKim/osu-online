import { Component, createRef } from 'react';

type ItemProps = {
  className?: string;
  height: number;
  offset: number;
  renderChild: () => React.ReactNode;
  onAttach: (el: Element, cb: (visible: boolean) => void) => void;
  onDetach: (el: Element) => void;
};

type ItemState = {
  top: number;
  visible: boolean;
};

// Requires shouldComponentUpdate
export default class VirtualListItem extends Component<ItemProps, ItemState> {
  ref = createRef<HTMLDivElement>();
  state = {
    top: 0,
    visible: false
  };

  componentDidMount() {
    const el = this.ref.current;

    if (el != null) {
      this.setState({
        top: el.offsetTop
      });

      this.props.onAttach(el, visible => this.setState({ visible }));
    }
  }

  componentWillUnmount() {
    if (this.ref.current) {
      this.props.onDetach(this.ref.current);
    }
  }

  shouldComponentUpdate(nextProps: ItemProps, nextState: ItemState) {
    if (nextState.visible) {
      return nextProps !== this.props || nextState !== this.state;
    }

    // Render one frame before going invisible
    return this.state.visible;
  }

  render() {
    const { className, height, offset, renderChild } = this.props;
    const { top, visible } = this.state;

    const pos = Math.min(Math.max(0, (top - offset) / window.innerHeight), 1);
    const x = 60 * (pos - 0.5) * (pos - 0.5);

    return (
      <div ref={this.ref} style={{ height, transform: `translateX(${x}%)` }}>
        {visible ? renderChild() : <div className={className} />}
      </div>
    );
  }
}
