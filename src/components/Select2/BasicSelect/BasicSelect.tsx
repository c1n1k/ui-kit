import React, { useState, useRef } from 'react';
import computeScrollIntoView from 'compute-scroll-into-view';

import { useSelect } from '../hooks/use-select';
import { cnSelect } from '../cnBlock';
import { IconSelect } from '../../../icons/IconSelect/IconSelect';
import '../styles.css';
import { Container } from '../components/Container';
import { Dropdown } from '../components/Dropdown';
import { PropForm, PropSize, PropWidth, PropView } from '../types';

type Props<T> = {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  form?: PropForm;
  size?: PropSize;
  width?: PropWidth;
  view?: PropView;
  options: T[];
  value: T | null;
  pageSize: number;
  onChange(value: T | T[] | null): void;
  onBlur?: (event?: React.FocusEvent<HTMLElement>) => void;
  onFocus?: (event?: React.FocusEvent<HTMLElement>) => void;
  getItemLabel(T): string;
  getItemKey(T): string;
};

function scrollIntoView(node: HTMLDivElement, menuNode: HTMLDivElement) {
  if (!node) {
    return;
  }

  const actions = computeScrollIntoView(node, {
    boundary: menuNode,
    block: 'nearest',
    scrollMode: 'if-needed',
  });
  actions.forEach(({ el, top, left }) => {
    el.scrollTop = top;
    el.scrollLeft = left;
  });
}

export const BasicSelect: <T>(p: Props<T>) => React.ReactElement<Props<T>> = (props) => {
  const {
    placeholder,
    onBlur,
    onFocus,
    options,
    onChange,
    value,
    pageSize = 10,
    getItemLabel,
    getItemKey,
    ...restProps
  } = props;
  const [isFocused, setIsFocused] = useState(false);

  const shiftAmount = pageSize;

  const optionsRef = useRef<HTMLDivElement | null>(null);

  const scrollToIndex = (index: number): void => {
    if (!optionsRef.current) {
      return;
    }

    const elements: NodeListOf<HTMLDivElement> = optionsRef.current.querySelectorAll(
      'div[role=option]'
    );

    scrollIntoView(elements[index], optionsRef.current);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (!restProps.disabled) {
      if (!isFocused) {
        setIsFocused(true);
      }
      if (onFocus) {
        onFocus(e);
      }
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (isFocused) {
      setIsFocused(false);

      if (onBlur) {
        onBlur(e);
      }
    }
  };

  const handleToggleDropdown = () => {
    setIsFocused(!isFocused);
  };

  // const handleClearValue = () => {
  //   onChange(null);
  // };

  const { visibleOptions, highlightedIndex, getToggleProps, getOptionProps, isOpen } = useSelect({
    options,
    value,
    onChange,
    optionsRef,
    shiftAmount,
    scrollToIndex,
  });

  return (
    <Container focused={isFocused} {...restProps}>
      <div className={cnSelect('Control')} aria-expanded={isOpen} aria-haspopup="listbox">
        <div className={cnSelect('ControlInner')}>
          <button
            {...getToggleProps()}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={cnSelect('ControlValueContainer')}
          >
            {value ? (
              <span className={cnSelect('ControlValue')}>{getItemLabel(value)}</span>
            ) : (
              <span className={cnSelect('ControlPlaceholder')}>{placeholder}</span>
            )}
          </button>
        </div>
        <span className={cnSelect('Indicators')}>
          <button
            className={cnSelect('IndicatorsDropdown')}
            tabIndex={-1}
            onClick={handleToggleDropdown}
          >
            <IconSelect size="xs" className={cnSelect('IndicatorsIcon')} />
          </button>
        </span>
      </div>
      {isOpen && (
        <Dropdown role="listbox">
          <div
            className={cnSelect('List')}
            ref={optionsRef}
            aria-activedescendant={`sample-${highlightedIndex}`}
          >
            {visibleOptions.map((option, index: number) => (
              <div
                aria-selected={option === value}
                role="option"
                key={getItemKey(option)}
                id={`sample-${index}`}
                {...getOptionProps({
                  index,
                  className: cnSelect('ListItem', {
                    active: option === value,
                    hovered: index === highlightedIndex,
                  }),
                })}
              >
                {getItemLabel(option)}
              </div>
            ))}
          </div>
        </Dropdown>
      )}
    </Container>
  );
};
