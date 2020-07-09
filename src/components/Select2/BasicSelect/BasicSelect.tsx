import React, { useState, useRef } from 'react';
import { useSelect } from '../hooks/use-select';
import { cnSelect } from '../cnBlock';
import { IconSelect } from '../../../icons/IconSelect/IconSelect';
import '../styles.css';
import { Container } from '../components/Container';
import { Dropdown } from '../components/Dropdown';
import { PropForm, PropSize, PropWidth, PropView } from '../types';

type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  form?: PropForm;
  size?: PropSize;
  width?: PropWidth;
  view?: PropView;
  options: SelectOption[];
  value: SelectOption | null;
  pageSize: number;
  onChange(value: SelectOption | SelectOption[] | null): void;
  onBlur?: (event?: React.FocusEvent<HTMLElement>) => void;
  onFocus?: (event?: React.FocusEvent<HTMLElement>) => void;
};

export const BasicSelect: React.FC<Props> = (props) => {
  // const itemToString = (item: SelectOption) => (item ? item.value : '');
  const {
    placeholder,
    onBlur,
    onFocus,
    options,
    onChange,
    value,
    pageSize = 10,
    ...restProps
  } = props;
  const [isFocused, setIsFocused] = useState(false);

  console.log(value);

  const shiftAmount = pageSize;

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

  const optionsRef = useRef<HTMLDivElement | null>(null);

  // const handleClearValue = () => {
  //   onChange(null);
  // };

  const {
    visibleOptions,
    selectedOption,
    highlightedIndex,
    getToggleProps,
    getOptionProps,
    isOpen,
  } = useSelect({
    options,
    value,
    onChange,
    optionsRef,
    shiftAmount,
  });

  return (
    <Container focused={isFocused} {...restProps}>
      <div className={cnSelect('Control')}>
        <button
          {...getToggleProps()}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={cnSelect('ControlValueContainer')}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {value ? (
            <span className={cnSelect('ControlValue')}>{value.label}</span>
          ) : (
            <span className={cnSelect('ControlPlaceholder')}>{placeholder}</span>
          )}
        </button>
        <span className={cnSelect('Indicators')}>
          <button
            type="button"
            onClick={handleToggleDropdown}
            className={cnSelect('IndicatorsDropdown')}
            tabIndex={-1}
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
            {visibleOptions.map((option: SelectOption, index: number) => (
              <div
                aria-selected={option === selectedOption}
                role="option"
                key={option.value}
                id={`sample-${index}`}
                {...getOptionProps({
                  index,
                  className: cnSelect('ListItem', {
                    active: option === selectedOption,
                    hovered: index === highlightedIndex,
                  }),
                })}
              >
                {option.label}
              </div>
            ))}
          </div>
        </Dropdown>
      )}
    </Container>
  );
};
