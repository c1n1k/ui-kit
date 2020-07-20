import * as React from 'react';
import { render, screen, fireEvent, RenderResult } from '@testing-library/react';

import { BasicSelect, SimpleSelectProps } from './BasicSelect';

type SelectOption = {
  value: string;
  label: string;
};

const items = [
  { label: 'Neptunium', value: 'Neptunium' },
  { label: 'Plutonium', value: 'Plutonium' },
  { label: 'Americium', value: 'Americium' },
  { label: 'Curium', value: 'Curium' },
  { label: 'Berkelium', value: 'Berkelium' },
];

const defaultProps = {
  options: items,
  value: null,
  onChange: jest.fn(),
  getItemLabel: (option) => option.label,
  getItemKey: (option) => option.value,
  getOptionValue: (option) => option.value,
  placeholder: 'placeholder',
  ariaLabel: 'test-select',
};

const renderComponent = (props: SimpleSelectProps<SelectOption> = defaultProps): RenderResult => {
  const {
    options,
    onChange,
    value,
    getItemLabel,
    getItemKey,
    getOptionValue,
    ...restProps
  } = props;
  return render(
    <BasicSelect
      value={value}
      onChange={onChange}
      options={options}
      getItemKey={getItemKey}
      getItemLabel={getItemLabel}
      getOptionValue={getOptionValue}
      {...restProps}
    />
  );
};

const getMenuButton = () => screen.getByLabelText('test-select');
const getList = () => screen.getByRole('listbox');

const openSelect = () => {
  fireEvent.click(getMenuButton());
};

describe('Компонент BasicSelect', () => {
  it('должен рендерится без ошибок', () => {
    expect(renderComponent).not.toThrow();
  });

  it('отрисовываются опции', () => {
    const select = renderComponent();

    openSelect();

    const list = getList();
    expect(list).toBeInTheDocument();

    const options = select.getAllByRole('option');
    expect(options.length).toEqual(5);
  });

  it.skip('выбирается опция', () => {
    const select = renderComponent();

    openSelect();

    const options = select.getAllByRole('option');
    const list = getList();

    expect(list).toBeInTheDocument();

    fireEvent.click(options[3]);

    expect(list).not.toBeInTheDocument();
    expect(getMenuButton().textContent).toBe('Americium');
  });

  it('вызывается onChange', () => {
    const handlerChange = jest.fn();
    const select = renderComponent({ ...defaultProps, onChange: handlerChange });

    openSelect();

    const options = select.getAllByRole('option');
    fireEvent.click(options[3]);

    expect(handlerChange).toBeCalledTimes(1);
  });
});
