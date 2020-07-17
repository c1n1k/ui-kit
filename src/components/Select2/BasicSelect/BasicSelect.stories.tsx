import React, { useState } from 'react';
import { withKnobs, text, select, boolean } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import { BasicSelect } from './BasicSelect';

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
  {
    label: 'Californium Berkelium Curium Plutonium',
    value: 'Californium Berkelium Curium Plutonium',
  },
  { label: 'Einsteinium', value: 'Einsteinium' },
  { label: 'Fermium', value: 'Fermium' },
  { label: 'Mendelevium', value: 'Mendelevium' },
  { label: 'Nobelium', value: 'Nobelium' },
  { label: 'Lawrencium', value: 'Lawrencium' },
  { label: 'Rutherfordium', value: 'Rutherfordium' },
  { label: 'Dubnium', value: 'Dubnium' },
  { label: 'Seaborgium', value: 'Seaborgium' },
  { label: 'Bohrium', value: 'Bohrium' },
  { label: 'Hassium', value: 'Hassium' },
  { label: 'Meitnerium', value: 'Meitnerium' },
  { label: 'Darmstadtium', value: 'Darmstadtium' },
  { label: 'Roentgenium', value: 'Roentgenium' },
  { label: 'Copernicium', value: 'Copernicium' },
  { label: 'Nihonium', value: 'Nihonium' },
  { label: 'Flerovium', value: 'Flerovium' },
  { label: 'Moscovium', value: 'Moscovium' },
  { label: 'Livermorium', value: 'Livermorium' },
  { label: 'Tennessine', value: 'Tennessine' },
  { label: 'Oganesson', value: 'Oganesson' },
];

const knobsContainer = () => ({
  disabled: boolean('disabled', false),
  size: select('size', ['xs', 's', 'm', 'l'], 'm'),
  view: select('view', ['default', 'clear'], 'default'),
  width: select('width', ['full', 'default'], 'default'),
  form: select(
    'form',
    [
      'default',
      'brick',
      'round',
      'clearRound',
      'roundClear',
      'clearDefault',
      'defaultClear',
      'defaultBrick',
      'brickDefault',
      'brickClear',
      'clearBrick',
      'clearClear',
    ],
    'default'
  ),
  placeholder: text('placeholder', 'Placeholder'),
});

storiesOf('Select/BasicSelect', module)
  .addDecorator(withKnobs)
  .add('BasicSelect', () => {
    const [value, setValue] = useState<SelectOption | null>(null);
    const getItemLabel = (option: SelectOption): string => option.label;
    const getItemKey = (option: SelectOption): string => option.value;
    const getItemValue = (option: SelectOption): string => option.value;
    const handlerChangeValue = (val: SelectOption) => setValue(val);

    return (
      <>
        <div style={{ width: '250px' }}>
          <BasicSelect<SelectOption>
            {...knobsContainer()}
            options={items}
            onChange={handlerChangeValue}
            value={value}
            getItemLabel={getItemLabel}
            getItemKey={getItemKey}
            getOptionValue={getItemValue}
          ></BasicSelect>
        </div>
      </>
    );
  });
