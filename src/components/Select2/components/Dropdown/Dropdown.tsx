import './Dropdown.css';

import React from 'react';
import { cnSelect } from '../../cnBlock';

type Props = {
  className?: string;
  role?: string;
  children: React.ReactNode;
};

// eslint-disable-next-line react/display-name
export const Dropdown = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { className, children, ...restProps } = props;

  return (
    <div className={cnSelect('Dropdown', [className])} ref={ref} {...restProps}>
      {children}
    </div>
  );
});
