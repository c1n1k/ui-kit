import './Container.css';

import React from 'react';
import { cnSelect } from '../../cnBlock';
import { PropForm, PropSize, PropWidth, PropView } from '../../types';

type Props = {
  className?: string;
  disabled?: boolean;
  form?: PropForm;
  size?: PropSize;
  width?: PropWidth;
  view?: PropView;
  focused?: boolean;
  children: React.ReactNode;
};

export const Container: React.FC<Props> = (props) => {
  const {
    size = 'm',
    width = 'default',
    form = 'default',
    view = 'default',
    className,
    disabled,
    children,
    focused,
  } = props;

  return (
    <div className={cnSelect({ size, width, form, disabled, view, focused }, [className])}>
      {children}
    </div>
  );
};
