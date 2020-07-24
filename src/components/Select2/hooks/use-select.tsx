import React, { SyntheticEvent, FocusEvent, CSSProperties } from 'react';
import { useKeys, useClickOutsideRef, KeyHandler, usePrevious } from './utils';

type State = {
  searchValue: string;
  resolvedSearchValue: string;
  isOpen: boolean;
  highlightedIndex: number;
};

type Action = string;

type Payload = {
  state: State;
  newState: State;
  action: Action;
};

type Reducer = (state: State, newState: State, action: Action) => State;
type Updater = (state: State) => State;

type ScrollToIndexFunctionType = (optionIndex: number) => void;
type OnChangeFunctionType = Function;

interface IEventHandler<E extends SyntheticEvent> {
  (event: E): void;
}

type FocusEventHandler = {
  event: FocusEvent;
  cb: IEventHandler<FocusEvent>;
};

type SetHandlerArg<T> = boolean | number | T;
type SetHandler<T> = (arg: SetHandlerArg<T>) => void;

export type SelectProps<T> = {
  options: T[];
  value: T[] | null;
  onChange: OnChangeFunctionType;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  scrollToIndex?: ScrollToIndexFunctionType;
  disabled?: boolean;
};

interface IOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
  style?: CSSProperties;
  className?: string;
  onClick?(e: React.SyntheticEvent): void;
  onMouseEnter?(e: React.SyntheticEvent): void;
}

type GetOptionPropsResult = {
  onClick(e: React.SyntheticEvent): void;
  onMouseEnter(e: React.SyntheticEvent): void;
} & JSX.IntrinsicElements['div'];

type NativeButtonProps = JSX.IntrinsicElements['button'];

interface IToggleProps extends NativeButtonProps {
  refKey?: string;
  ref?: React.MutableRefObject<HTMLButtonElement | null>;
}

interface IGetTogglePropsResult extends React.HTMLProps<HTMLButtonElement> {
  disabled?: boolean;
}

type UseSelectResult<T> = {
  searchValue?: string;
  isOpen: boolean;
  highlightedIndex: number;
  visibleOptions: T[];
  value: T[] | null;
  // Actions
  selectIndex: SetHandler<T>;
  removeValue?: SetHandler<T>;
  setOpen(isOpen: boolean): void;
  setSearch?(value: string): void;
  highlightIndex: SetHandler<T>;
  // Prop Getters
  getToggleProps(props?: IToggleProps): IGetTogglePropsResult;
  getOptionProps(props: IOptionProps): GetOptionPropsResult;
};

const actions = {
  setOpen: 'setOpen',
  setSearch: 'setSearch',
  highlightIndex: 'highlightIndex',
};

const initialState = {
  searchValue: '',
  resolvedSearchValue: '',
  isOpen: false,
  highlightedIndex: 0,
};

function useHoistedState(initialState: State): [State, (updater: Updater, action: Action) => void] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const reducerRef = React.useRef<Reducer>((old, newState, action) => newState);
  const [state, _setState] = React.useState<State>(initialState);
  const setState = React.useCallback(
    (updater: Updater, action: Action) => {
      if (!action) {
        throw new Error('An action type is required to update the state');
      }
      return _setState((old) => reducerRef.current(old, updater(old), action));
    },
    [_setState]
  );
  return [state, setState];
}

export function useSelect<T>({
  options,
  value,
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  scrollToIndex,
  containerRef,
  disabled = false,
}: SelectProps<T>): UseSelectResult<T> {
  const [{ searchValue, isOpen, highlightedIndex }, setState] = useHoistedState(initialState);

  // Refs

  const inputRef = React.useRef<HTMLElement>();
  const onBlurRef = React.useRef<{
    cb(e: React.FocusEvent): void;
    event: React.FocusEvent | null;
  }>();
  const onChangeRef = React.useRef<OnChangeFunctionType>();
  const scrollToIndexRef = React.useRef<ScrollToIndexFunctionType>();

  scrollToIndexRef.current = scrollToIndex;

  onChangeRef.current = onChange;

  if (!value) {
    value = [];
  }

  const getSelectedOptionIndex = () => {
    if (value) {
      const selectedOptionIndex = options.indexOf(value[0]);

      return selectedOptionIndex > 0 ? selectedOptionIndex : 0;
    }

    return 0;
  };

  // Actions

  const setOpen = React.useCallback(
    (newIsOpen: boolean) => {
      setState(
        (old) => ({
          ...old,
          isOpen: newIsOpen,
        }),
        actions.setOpen
      );
    },
    [setState]
  );

  const prevIsOpen = usePrevious(isOpen);

  React.useLayoutEffect(() => {
    if (value !== null && !prevIsOpen && isOpen) {
      const currentHighlightIndex = getSelectedOptionIndex();
      scrollToIndexRef.current && scrollToIndexRef.current(currentHighlightIndex);
    }
  });

  const highlightIndex = React.useCallback(
    (value: T) => {
      setState((old) => {
        return {
          ...old,
          highlightedIndex: Math.min(
            Math.max(0, typeof value === 'function' ? value(old.highlightedIndex) : value),
            options.length - 1
          ),
        };
      }, actions.highlightIndex);
    },
    [options, setState]
  );

  const selectIndex = React.useCallback(
    (index) => {
      const option = options[index];
      if (option && onChangeRef.current) {
        onChangeRef.current(option);

        setOpen(false);
      }
    },
    [options, value, setOpen]
  );

  // Handlers

  const handleValueFieldChange = () => {
    !disabled && setOpen(true);
  };

  const handleValueFieldClick = () => {
    !disabled && setOpen(!isOpen);
  };

  const handleValueFieldFocus = () => handleValueFieldClick();

  // Prop Getters

  const ArrowUp: KeyHandler = () => ({}, e: React.SyntheticEvent) => {
    e.preventDefault();
    !disabled && setOpen(true);
    highlightIndex((old) => old - 1);
  };

  const ArrowDown: KeyHandler = () => ({}, e: React.SyntheticEvent) => {
    e.preventDefault();
    !disabled && setOpen(true);
    highlightIndex((old) => old + 1);
  };

  const Enter = ({}, e: React.KeyboardEvent) => {
    if (isOpen) {
      if (searchValue || options[highlightedIndex]) {
        e.preventDefault();
      }
      if (options[highlightedIndex]) {
        selectIndex(highlightedIndex);
      }
    }
  };

  const Escape = () => {
    setOpen(false);
  };

  const Tab = () => {
    setOpen(false);
  };

  const getKeyProps = useKeys({
    ArrowUp: ArrowUp(),
    ArrowDown: ArrowDown(),
    PageUp: ArrowUp(),
    PageDown: ArrowDown(),
    Home: ArrowUp(),
    End: ArrowDown(),
    Enter,
    Escape,
    Tab,
  });

  const getToggleProps = ({
    refKey = 'ref',
    ref,
    onChange,
    onFocus,
    onClick,
    onBlur,
    ...rest
  }: IToggleProps = {}): IGetTogglePropsResult => {
    return getKeyProps({
      [refKey]: (el: HTMLButtonElement) => {
        inputRef.current = el;
        if (ref) {
          ref.current = el;
        }
      },
      onChange: (e) => {
        handleValueFieldChange();
        if (typeof onChange === 'function') {
          onChange(e);
        }
      },
      onFocus: (e) => {
        handleValueFieldFocus();
        if (typeof onFocus === 'function') {
          onFocus(e);
        }
      },
      onClick: (e) => {
        handleValueFieldClick();
        if (typeof onClick === 'function') {
          onClick(e);
        }
      },
      onBlur: (e) => {
        if (typeof onBlur === 'function' && onBlurRef.current) {
          e.persist();
          onBlurRef.current = { cb: onBlur, event: e };
        }
      },
      ...rest,
    });
  };

  const getOptionProps = ({ index, onClick, onMouseEnter, ...rest }): GetOptionPropsResult => {
    return {
      ...rest,
      onClick: (e: React.SyntheticEvent) => {
        selectIndex(index);
        if (typeof onClick === 'function') {
          onClick(e);
        }
      },
      onMouseEnter: (e: React.SyntheticEvent) => {
        highlightIndex(index);
        if (typeof onMouseEnter === 'function') {
          onMouseEnter(e);
        }
      },
    };
  };

  // Effects

  // When the user clicks outside of the options box
  // while open, we need to close the dropdown
  useClickOutsideRef(
    isOpen,
    () => {
      setOpen(false);
    },
    containerRef
  );

  React.useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  // When searching, activate the first option
  React.useEffect(() => {
    const currentHighlightIndex = getSelectedOptionIndex();
    highlightIndex(currentHighlightIndex);
  }, [highlightIndex]);

  // When we open and close the options, set the highlightedIndex to 0
  React.useEffect(() => {
    const currentHighlightIndex = getSelectedOptionIndex();
    highlightIndex(currentHighlightIndex);

    if (!isOpen && onBlurRef.current && onBlurRef.current.event) {
      onBlurRef.current.cb(onBlurRef.current.event);
      onBlurRef.current.event = null;
    }
  }, [isOpen, highlightIndex]);

  // When the highlightedIndex changes, scroll to that item
  React.useEffect(() => {
    scrollToIndexRef.current && scrollToIndexRef.current(highlightedIndex);
  }, [highlightedIndex]);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current && inputRef.current.focus();
      const currentHighlightIndex = getSelectedOptionIndex();
      scrollToIndexRef.current && scrollToIndexRef.current(currentHighlightIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, inputRef.current]);

  return {
    // State
    isOpen,
    highlightedIndex,
    visibleOptions: options,
    value,
    // Actions
    selectIndex,
    setOpen,
    highlightIndex,
    // Prop Getters
    getToggleProps,
    getOptionProps,
  };
}
