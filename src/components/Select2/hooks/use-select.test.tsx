import * as React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';

import { useSelect } from './use-select';

type Option = {
  label: string;
  value: string;
};

const options = [
  { label: 'Neptunium', value: 'Neptunium' },
  { label: 'Plutonium', value: 'Plutonium' },
  { label: 'Americium', value: 'Americium' },
  { label: 'Curium', value: 'Curium' },
  { label: 'Berkelium', value: 'Berkelium' },
];

const defaultProps = {
  isOpen: false,
  value: null,
  scrollToIndex: jest.fn(),
  onChange: jest.fn(),
  multi: false,
  disabled: false,
  optionsRef: { current: null },
  containerRef: { current: null },
  options,
};

describe('Хук useSelect', () => {
  test('setOpen изменяется', () => {
    const { result } = renderHook(() =>
      useSelect({
        ...defaultProps,
      })
    );

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.isOpen).toBe(true);
  });

  test('вызываются обработчики событий в getOptionProps', () => {
    const handleClick = jest.fn();
    const handleMouseEnter = jest.fn();

    const { result } = renderHook(() =>
      useSelect({
        ...defaultProps,
        value: null,
      })
    );

    expect(handleClick).toBeCalledTimes(0);
    expect(handleMouseEnter).toBeCalledTimes(0);
    const optionProps = result.current.getOptionProps({
      index: 1,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
    });

    act(() => {
      optionProps.onClick({} as React.SyntheticEvent);
      optionProps.onMouseEnter({} as React.SyntheticEvent);
    });

    expect(handleClick).toBeCalledTimes(1);
    expect(handleMouseEnter).toBeCalledTimes(1);
  });
});
