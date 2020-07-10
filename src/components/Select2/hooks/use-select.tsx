import React, { SyntheticEvent, FocusEvent, CSSProperties } from 'react';
import { Option } from '../../Select/Option';
import { useDebounce, useKeys, useClickOutsideRef } from './utils';

type Option = {
  value: string;
  label: string;
};

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

type CreateLabelFunctionType = (d: string) => string;
type FilterFunctionType = (options: Option[], searchValue: string) => Option[];
type ScrollToIndexFunctionType = (optionIndex: number) => void;
type OnChangeFunctionType = (value: Option | Option[] | null) => void;

interface IEventHandler<E extends SyntheticEvent> {
  (event: E): void;
}

type FocusEventHandler = {
  event: FocusEvent;
  cb: IEventHandler<FocusEvent>;
};

type SetHandlerArg = boolean | number | Option;

type SetHandler = (arg: SetHandlerArg) => void;

type SelectProps = {
  options: Option[];
  value: Option | Option[] | null;
  onChange: OnChangeFunctionType;
  optionsRef: React.MutableRefObject<HTMLDivElement | null>;
  multi?: boolean;
  create?: boolean;
  getCreateLabel?: CreateLabelFunctionType;
  stateReducer?: Reducer;
  duplicates?: boolean;
  scrollToIndex?: ScrollToIndexFunctionType;
  shiftAmount: number;
  filterFn?: FilterFunctionType;
  getDebounce?(options: Option[]): number;
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

type GetTogglePropsResult = any;

type UseSelectResult = {
  searchValue: string;
  isOpen: boolean;
  highlightedIndex: number;
  selectedOption: Option | Option[] | undefined;
  visibleOptions: Option[];
  value: Option | Option[] | null;
  // Actions
  selectIndex: SetHandler;
  removeValue: SetHandler;
  setOpen(isOpen: boolean): void;
  setSearch(value: string): void;
  highlightIndex: SetHandler;
  // Prop Getters
  getToggleProps(props?: IToggleProps): GetTogglePropsResult;
  getOptionProps(props: IOptionProps): GetOptionPropsResult;
};

const actions = {
  setOpen: 'setOpen',
  setSearch: 'setSearch',
  highlightIndex: 'highlightIndex',
};

export const defaultFilterFn: FilterFunctionType = (options, searchValue) => {
  return options
    .filter((option) => option.value.toLowerCase().includes(searchValue.toLowerCase()))
    .sort((a) => {
      return a.value.toLowerCase().indexOf(searchValue.toLowerCase());
    });
};

const initialState = {
  searchValue: '',
  resolvedSearchValue: '',
  isOpen: false,
  highlightedIndex: 0,
};

function useHoistedState(
  initialState: State,
  reducer: Reducer
): [State, (updater: Updater, action: Action) => void] {
  const reducerRef = React.useRef<Reducer>();
  reducerRef.current = reducer;
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

// const isValueSingleOption = (arg: Option | Option[] | null): boolean => {
//   if (!arg || Array.isArray(arg)) return false;

//   return true;
// };

export function useSelect({
  multi,
  create,
  getCreateLabel = (d) => `Use "${d}"`,
  stateReducer = (old, newState, action) => newState,
  duplicates,
  options,
  value,
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  scrollToIndex = () => {},
  shiftAmount,
  filterFn = defaultFilterFn,
  optionsRef,
  getDebounce = (options) => (options.length > 10000 ? 1000 : options.length > 1000 ? 200 : 0),
}: SelectProps): UseSelectResult {
  const [
    { searchValue, resolvedSearchValue, isOpen, highlightedIndex },
    setState,
  ] = useHoistedState(initialState, stateReducer);

  // Refs

  const inputRef = React.useRef<HTMLElement>();
  const onBlurRef = React.useRef<{
    cb(e: React.FocusEvent): void;
    event: React.FocusEvent<HTMLButtonElement> | null;
  }>();
  const onChangeRef = React.useRef<OnChangeFunctionType>();
  const filterFnRef = React.useRef<FilterFunctionType>();
  const getCreateLabelRef = React.useRef<CreateLabelFunctionType>();
  const scrollToIndexRef = React.useRef<ScrollToIndexFunctionType>();

  filterFnRef.current = filterFn;
  scrollToIndexRef.current = scrollToIndex;
  getCreateLabelRef.current = getCreateLabel;

  onChangeRef.current = onChange;

  // We need to memoize these default values to keep things
  // from rendereing without cause
  const defaultMultiValue = React.useMemo(() => [], []);
  const defaultOptions = React.useMemo(() => [], []);

  // Multi should always at least have an empty array as the value
  if (multi && typeof value === 'undefined') {
    value = defaultMultiValue;
  }

  // If no options are provided, then use an empty array
  if (!options) {
    options = defaultOptions;
  }

  const originalOptions = options;

  // If multi and duplicates aren't allowed, filter out the
  // selected options from the options list
  options = React.useMemo(() => {
    if (multi && !duplicates) {
      return options.filter(
        (option) => value && !Array.isArray(value) && !value.value.includes(option.value)
      );
    }
    return options;
  }, [options, value, duplicates, multi]);

  // Compute the currently selected option(s)
  const selectedOption = React.useMemo(() => {
    if (Array.isArray(value)) {
      return value.map(
        (val) =>
          originalOptions.find((d) => d.value === val.value) || {
            label: val.label,
            value: val.value,
          }
      );
    }

    if (value && !Array.isArray(value)) {
      return originalOptions.find((option) => option === value);
    }
  }, [multi, value, originalOptions]);

  const getSelectedOptionIndex = () => {
    if (selectedOption) {
      const firstSelectedOption = Array.isArray(selectedOption)
        ? selectedOption[0]
        : selectedOption;
      const selectedOptionIndex = originalOptions.indexOf(firstSelectedOption);

      return selectedOptionIndex > 0 ? selectedOptionIndex : 0;
    }

    return 0;
  };

  // If there is a search value, filter the options for that value
  // TODO: This is likely where we will perform async option fetching
  // in the future.
  options = React.useMemo(() => {
    if (resolvedSearchValue && filterFnRef.current) {
      return filterFnRef.current(options, resolvedSearchValue);
    }
    return options;
  }, [options, resolvedSearchValue]);

  // If in create mode and we have a search value, fabricate
  // an option for that searchValue and prepend it to options
  options = React.useMemo(() => {
    if (create && searchValue && getCreateLabelRef.current) {
      return [{ label: getCreateLabelRef.current(searchValue), value: searchValue }, ...options];
    }
    return options;
  }, [create, searchValue, options]);

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

      if (selectedOption && newIsOpen) {
        const currentHighlightIndex = getSelectedOptionIndex();
        scrollToIndexRef.current && scrollToIndexRef.current(currentHighlightIndex);
      }
    },
    [setState]
  );

  const setResolvedSearch = useDebounce((value: string) => {
    setState(
      (old) => ({
        ...old,
        resolvedSearchValue: value,
      }),
      actions.setSearch
    );
  }, getDebounce(options));

  const setSearch = React.useCallback(
    (value: string) => {
      setState(
        (old) => ({
          ...old,
          searchValue: value,
        }),
        actions.setSearch
      );
      setResolvedSearch(value);
    },
    [setState, setResolvedSearch]
  );

  const highlightIndex = React.useCallback(
    (value) => {
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
      if (option) {
        if (!multi && onChangeRef.current) {
          onChangeRef.current(option);
        } else {
          if (duplicates || (value && Array.isArray(value) && !value.includes(option))) {
            Array.isArray(value) && onChangeRef.current && onChangeRef.current([...value, option]);
          }
        }
      }

      if (!multi) {
        setOpen(false);
      } else {
        setSearch('');
      }
    },
    [multi, options, duplicates, value, setOpen, setSearch]
  );

  const removeValue = React.useCallback(
    (index) => {
      if (Array.isArray(value)) {
        onChangeRef.current && onChangeRef.current(value.filter((d, i) => i !== index));
      }
    },
    [value]
  );

  // Handlers

  const handleSearchValueChange = (e) => {
    if (e.target) {
      setSearch(e.target.value);
    }
    setOpen(true);
  };

  const handleSearchClick = () => {
    if (!create || multi) {
      setSearch('');
    }
    setOpen(true);
  };

  const handleSearchFocus = () => handleSearchClick();

  // Prop Getters

  type KeyHandler = (
    defaultShift?: boolean,
    defaultMeta?: boolean
  ) => (prop: { shift: number; meta: any }, e: React.KeyboardEvent) => void;

  const ArrowUp: KeyHandler = (defaultShift, defaultMeta) => (
    { shift, meta },
    e: React.SyntheticEvent
  ) => {
    e.preventDefault();
    const amount =
      defaultMeta || meta ? 1000000000000 : defaultShift || shift ? shiftAmount - 1 : 1;
    setOpen(true);
    highlightIndex((old) => old - amount);
  };

  const ArrowDown: KeyHandler = (defaultShift, defaultMeta) => (
    { shift, meta },
    e: React.SyntheticEvent
  ) => {
    e.preventDefault();
    const amount =
      defaultMeta || meta ? 1000000000000 : defaultShift || shift ? shiftAmount - 1 : 1;
    setOpen(true);
    highlightIndex((old) => old + amount);
  };

  const Enter = (_, e: React.KeyboardEvent) => {
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

  const Backspace = () => {
    if (!multi || searchValue) {
      return;
    }
    Array.isArray(value) && removeValue(value.length - 1);
  };

  const getKeyProps = useKeys({
    ArrowUp: ArrowUp(),
    ArrowDown: ArrowDown(),
    PageUp: ArrowUp(true),
    PageDown: ArrowDown(true),
    Home: ArrowUp(false, true),
    End: ArrowDown(false, true),
    Enter,
    Escape,
    Tab,
    Backspace,
  });

  const getToggleProps = ({
    refKey = 'ref',
    ref,
    onChange,
    onFocus,
    onClick,
    onBlur,
    ...rest
  }: IToggleProps = {}): GetTogglePropsResult => {
    return getKeyProps({
      [refKey]: (el: HTMLButtonElement) => {
        inputRef.current = el;
        if (ref) {
          ref.current = el;
        }
      },
      // value: (isOpen ? searchValue : selectedOption ? selectedOption.label : '') || '',
      onChange: (e) => {
        handleSearchValueChange(e);
        if (onChange) {
          onChange(e);
        }
      },
      onFocus: (e) => {
        handleSearchFocus();
        if (onFocus) {
          onFocus(e);
        }
      },
      onClick: (e) => {
        handleSearchClick();
        if (onClick) {
          onClick(e);
        }
      },
      onBlur: (e) => {
        if (onBlur && onBlurRef.current) {
          e.persist();
          onBlurRef.current.cb = onBlur;
          onBlurRef.current.event = e;
        }
      },
      ...rest,
    });
  };

  const getOptionProps = ({ index, onClick, onMouseEnter, ...rest }): GetOptionPropsResult => {
    if (typeof index !== 'number' || index < 0) {
      throw new Error(
        `useSelect: The getOptionProps prop getter requires an index property, eg. 'getOptionProps({index: 1})'`
      );
    }

    return {
      ...rest,
      onClick: (e: React.SyntheticEvent) => {
        selectIndex(index);
        if (onClick) {
          onClick(e);
        }
      },
      onMouseEnter: (e: React.SyntheticEvent) => {
        highlightIndex(index);
        if (onMouseEnter) {
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
    optionsRef
  );

  // When searching, activate the first option
  React.useEffect(() => {
    const currentHighlightIndex = getSelectedOptionIndex();
    highlightIndex(currentHighlightIndex);
  }, [searchValue, highlightIndex]);

  // When we open and close the options, set the highlightedIndex to 0
  React.useEffect(() => {
    const currentHighlightIndex = getSelectedOptionIndex();
    highlightIndex(currentHighlightIndex);

    if (!isOpen && onBlurRef.current?.event) {
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
      setTimeout(() => {
        inputRef.current && inputRef.current.focus();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, inputRef.current]);

  return {
    // State
    searchValue,
    isOpen,
    highlightedIndex,
    selectedOption,
    visibleOptions: options,
    value,
    // Actions
    selectIndex,
    removeValue,
    setOpen,
    setSearch,
    highlightIndex,
    // Prop Getters
    getToggleProps,
    getOptionProps,
  };
}
