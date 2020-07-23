import React, { useState, useRef } from 'react';

import { useSelect } from '../hooks/use-select';
import { cnSelect } from '../cnSelect';
import { IconSelect } from '../../../icons/IconSelect/IconSelect';
import '../styles.css';
import { Container } from '../components/Container';
import { Dropdown } from '../components/Dropdown';
import { PropForm, PropSize, PropWidth, PropView } from '../types';
import { scrollIntoView } from '../hooks/utils';

export type SimpleSelectProps<T> = {
  options: T[];
  value?: T | null;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  form?: PropForm;
  size?: PropSize;
  width?: PropWidth;
  view?: PropView;
  ariaLabel?: string;
  onChange?: () => void;
  getItemLabel(arg: T): string;
  getItemKey(arg: T): string;
  getOptionValue(arg: T): string | string[];
  onBlur?: (event?: React.FocusEvent<HTMLElement>) => void;
  onFocus?: (event?: React.FocusEvent<HTMLElement>) => void;
};

export const BasicSelect: <T>(
  p: SimpleSelectProps<T>
) => React.ReactElement<SimpleSelectProps<T>> = (props) => {
  const {
    placeholder,
    onBlur,
    onFocus,
    options,
    onChange,
    value,
    getItemLabel,
    getItemKey,
    disabled,
    ariaLabel,
    ...restProps
  } = props;
  const [isFocused, setIsFocused] = useState(false);
  const [val, setValue] = useState<typeof value>(value);

  const handlerChangeValue = (v: typeof value) => {
    // istanbul ignore else path
    if (onChange) {
      onChange();
    }
    setValue(v);
  };

  const optionsRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const arrValue = val ? [val] : null;

  const scrollToIndex = (index: number): void => {
    if (!optionsRef.current) {
      return;
    }

    const elements: NodeListOf<HTMLDivElement> = optionsRef.current.querySelectorAll(
      'div[role=option]'
    );

    scrollIntoView(elements[index], optionsRef.current);
  };

  const {
    visibleOptions,
    highlightedIndex,
    getToggleProps,
    getOptionProps,
    isOpen,
    setOpen,
  } = useSelect({
    options,
    value: arrValue,
    onChange: handlerChangeValue,
    containerRef,
    scrollToIndex,
    disabled,
  });

  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    // istanbul ignore else path
    if (!disabled) {
      if (!isFocused) {
        setIsFocused(true);
      }
      if (onFocus) {
        onFocus(e);
      }
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLElement>) => {
    // istanbul ignore else path
    if (isFocused) {
      setIsFocused(false);

      // istanbul ignore else path
      if (onBlur) {
        onBlur(e);
      }
    }
  };

  const handleToggleDropdown = () => {
    setOpen(!isOpen);
    setIsFocused(true);
  };

  return (
    <Container focused={isFocused} disabled={disabled} ref={containerRef} {...restProps}>
      <div className={cnSelect('Control')} aria-expanded={isOpen} aria-haspopup="listbox">
        <div className={cnSelect('ControlInner')}>
          <button
            {...getToggleProps()}
            type="button"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={cnSelect('ControlValueContainer')}
            aria-label={ariaLabel}
          >
            {arrValue ? (
              <span className={cnSelect('ControlValue')}>{getItemLabel(arrValue[0])}</span>
            ) : (
              <span className={cnSelect('ControlPlaceholder')}>{placeholder}</span>
            )}
          </button>
        </div>
        <span className={cnSelect('Indicators')}>
          <button
            type="button"
            className={cnSelect('IndicatorsDropdown')}
            tabIndex={0}
            onClick={handleToggleDropdown}
          >
            <IconSelect size="xs" className={cnSelect('DropdownIndicatorIcon')} />
          </button>
        </span>
      </div>
      {isOpen && (
        <Dropdown role="listbox" aria-activedescendant={`sample-${highlightedIndex}`}>
          <div className={cnSelect('List')} ref={optionsRef}>
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
