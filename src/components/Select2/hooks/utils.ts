import React from 'react';

type KeyProps = {
  onKeyDown?(e: React.KeyboardEvent): void;
  onChange(e: React.SyntheticEvent<HTMLButtonElement>): void;
  onFocus(e: React.FocusEvent<HTMLButtonElement>): void;
  onClick(e: React.MouseEvent<HTMLButtonElement>): void;
  onBlur(e: React.FocusEvent<HTMLButtonElement>): void;
};

export function useDebounce(fn, time = 0) {
  const ref = React.useRef<number | undefined | null>();
  const fnRef = React.useRef();

  fnRef.current = fn;

  React.useEffect(() => {
    return () => {
      clearTimeout(ref.current);
    };
  }, [time]);

  return React.useCallback(
    async (...args) => {
      if (ref.current) {
        clearTimeout(ref.current);
      }
      return new Promise((resolve, reject) => {
        ref.current = setTimeout(() => {
          ref.current = null;
          try {
            resolve(fnRef.current(...args));
          } catch (err) {
            reject(err);
          }
        }, time);
      });
    },
    [time]
  );
}

export const useKeys = (userKeys) => {
  return ({ onKeyDown, ...rest }: KeyProps) => {
    return {
      ...rest,
      onKeyDown: (e) => {
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

export function useClickOutsideRef(enable, fn, userRef) {
  const localRef = React.useRef();
  const fnRef = React.useRef();

  fnRef.current = fn;
  const elRef = userRef || localRef;

  const handle = React.useCallback(
    (e) => {
      const isTouch = e.type === 'touchstart';
      if (e.type === 'click' && isTouch) {
        return;
      }
      const el = elRef.current;
      if (el && !el.contains(e.target)) fnRef.current(e);
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
