import React from 'react';

const extendComponent = (ChildComponent, ParentComponent) => {
  class ExtendedComponent extends ParentComponent {
    render() {
      return <ChildComponent {...this.props} />;
    }
  }

  return ExtendedComponent;
};

export default extendComponent;
