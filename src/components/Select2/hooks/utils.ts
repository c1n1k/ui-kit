import React from 'react';

export type KeyHandler = (
  defaultShift?: boolean,
  defaultMeta?: boolean
) => (prop: { shift: boolean; meta: boolean }, e: React.KeyboardEvent) => void;

export type KeyProps = {
  onKeyDown?(e: React.KeyboardEvent): void;
  onChange(e: React.SyntheticEvent<HTMLButtonElement>): void;
  onFocus(e: React.FocusEvent<HTMLButtonElement>): void;
  onClick(e: React.MouseEvent<HTMLButtonElement>): void;
  onBlur(e: React.FocusEvent<HTMLButtonElement>): void;
};

export type UserKeysProps = {
  [key: string]: (
    prop: { keyCode: number; key: string; shift: boolean; meta: boolean },
    e: React.KeyboardEvent<Element>
  ) => void;
};

export function useDebounce(time = 0, fn: Function) {
  const timeoutIDRef = React.useRef<ReturnType<typeof setTimeout> | null>();
  const fnRef = React.useRef<Function>();

  fnRef.current = fn;

  React.useEffect(() => {
    return () => {
      if (timeoutIDRef.current) {
        clearTimeout(timeoutIDRef.current);
      }
    };
  }, [time]);

  return React.useCallback(
    async (...args) => {
      if (timeoutIDRef.current) {
        clearTimeout(timeoutIDRef.current);
      }
      return new Promise((resolve) => {
        timeoutIDRef.current = setTimeout(() => {
          if (timeoutIDRef.current && fnRef.current) {
            timeoutIDRef.current = null;
            resolve(fnRef.current(...args));
          }
        }, time);
      });
    },
    [time]
  );
}

export const useKeys = (userKeys: UserKeysProps) => {
  return ({ onKeyDown, ...rest }: KeyProps) => {
    return {
      ...rest,
      onKeyDown: (e: React.KeyboardEvent) => {
        const { keyCode, key, shiftKey: shift, metaKey: meta } = e;
        const handler = userKeys[key] || userKeys[keyCode];
        if (handler) {
          handler(
            {
              keyCode,
              key,
              shift,
              meta,
            },
            e
          );
        }
        if (onKeyDown) {
          onKeyDown(e);
        }
      },
    };
  };
};

export function useClickOutsideRef(enable, fn: (e: React.SyntheticEvent) => void, userRef) {
  const localRef = React.useRef();
  const fnRef = React.useRef<(e: React.SyntheticEvent) => void>();

  fnRef.current = fn;
  const elRef = userRef || localRef;

  const handle = React.useCallback(
    (e) => {
      const isTouch = e.type === 'touchstart';
      if (e.type === 'click' && isTouch) {
        return;
      }
      const el = elRef.current;
      if (el && !el.contains(e.target) && fnRef.current) fnRef.current(e);
    },
    [elRef]
  );

  React.useEffect(() => {
    if (enable) {
      document.addEventListener('touchstart', handle, true);
      document.addEventListener('click', handle, true);
    }

    return () => {
      document.removeEventListener('touchstart', handle, true);
      document.removeEventListener('click', handle, true);
    };
  }, [enable, handle]);
}
