/*
This component generated a specific type of graph using data that came from previous steps in this multistep activity
*/

import React, { useEffect, useState } from "react";
import Cta from "../cta";
import Icon from "../icon";

import type { PowerMapProps } from "./interfaces";
import clsx from "clsx";
import type { StylesConfig } from "react-select";
import Select from "react-select";
import ReactTooltip from "react-tooltip";

export const updateColumnNameToLabel = (name: string) => {
  return name.replace(/\s+|[,/]/gi, "-").toLocaleLowerCase();
};

export const getColumnNamesInitialObject = (columns: string[]) => {
  return columns.reduce((acc, curr) => {
    const name = updateColumnNameToLabel(curr);

    return {
      ...acc,
      [name]: null,
    };
  }, {})
}

export const getInitializedEmptyTableData = (rowCount: number, columns: string[]) => {
  return [...Array(rowCount).keys()].map(num => {
    return getColumnNamesInitialObject(columns);
  });
}

export default function PowerMap({
  __type,
  id,
  columns,
  numberOfTextFields,
  contactLimit,
  initialNumberOfRows,
  completedCallback,
  enableOn,
  step,
  activityData,
}: PowerMapProps): JSX.Element {
  const [rowCount, setRowCount] = useState<number>(initialNumberOfRows);
  const [formData, setFormData] = useState<any>([]);

  useEffect(() => {
    ReactTooltip.rebuild();
  }, [step, formData])

  useEffect(() => {
    // Fill out form with previous data if it exists
    if (activityData.data[`${__type}-${id}`]?.data) {
      const filledRows = activityData.data[`${__type}-${id}`]?.data.filter((row: { [key: string]: string }) => Object.values(row).some(el => !!el));

      // Previous data exists
      if (filledRows.length > 0) {
        // If we have more rows than the initial specified,
        // update the row count as well the form data
        if (filledRows.length >= initialNumberOfRows) {
          setFormData(filledRows);
          setRowCount(filledRows.length);
        } else {
          // Otherwise, initialize empty rows up until
          // initial num of rows is reached
          const remainingNumRows = initialNumberOfRows - filledRows.length;
          const fillers = getInitializedEmptyTableData(remainingNumRows, columns);
          setFormData([...filledRows, ...fillers]);
        }
      } else {
        // Otherwise, initialize empty form
        setFormData(getInitializedEmptyTableData(rowCount, columns))
      }

    } else {
      // Otherwise, initialize empty form
      setFormData(getInitializedEmptyTableData(rowCount, columns))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveFormData = () => {
    const formDataWithValues = formData.filter((data: { [key: string]: string }) => Object.values(data).some(el => !!el));

    //Calculate highest stacked bar graph
    const greatestStack = formDataWithValues.reduce(
      (greatest: { [key: string]: string }, row: { [key: string]: string }) => {
        let total = Object.values(row)
          .slice(numberOfTextFields)
          .reduce((a: number, b: any) => {
            return a + parseInt(b);
          }, 0);

        let prevTotal = Object.values(greatest)
          .slice(numberOfTextFields)
          .reduce((a: number, b: any) => {
            return a + parseInt(b);
          }, 0);

        return total > prevTotal ? row : greatest;
      },
      formDataWithValues[0]
    );

    completedCallback(
      {
        [`${__type}-${id}`]: {
          data: formDataWithValues,
          columnNames: columns,
          textColumnNames: columns.slice(0, numberOfTextFields),
          labels: columns.slice(numberOfTextFields),
          indexOfGreatest: formDataWithValues.indexOf(greatestStack),
          text: greatestStack[columns[0].toLowerCase()], //Creating this property for when this is referenced by a text-edit model
        },
      },
      true
    );
  };

  return (
    <div className="power-map">
      <form className="power-map__form" autoComplete="false" method="post">
        <table>
          <thead>
            <tr>
              {columns.map((c, idx) => {
                const numberInputLabel = idx + 1 > numberOfTextFields;

                return (
                  <th
                    className={clsx(
                      numberInputLabel && "power-map__number-input",
                      !numberInputLabel && "power-map__text-input"
                    )}
                    key={idx}
                  >
                    <span>{c}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {[...Array(rowCount).keys()].map((_, index) => (
              <PowerMapInputs
                key={`power-map-row-${index}`}
                columns={columns}
                numberOfTextFields={numberOfTextFields}
                enableOn={enableOn}
                step={step}
                row={index}
                formData={formData}
                setFormData={setFormData}
                saveFormData={saveFormData}
              />
            ))}
            {rowCount < contactLimit && (
              <tr>
                <td className="power-map__add-row-container">
                  <Cta
                    isButton
                    action={() => {
                      setFormData([...formData, getColumnNamesInitialObject(columns)]);
                      setRowCount((prev) => prev + 1);
                    }}
                    modifiers={["cta--sm", "cta--with-icon", "cta--bg-subtle"]}
                  >
                    <span>Add row</span>
                    <Icon name="plus" color="#0a49aa" />
                  </Cta>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </form>
      <ReactTooltip />
    </div>
  );
}

const PowerMapInputs = ({
  columns,
  numberOfTextFields,
  enableOn,
  step,
  row,
  formData,
  setFormData,
  saveFormData,
}: {
  columns: string[];
  numberOfTextFields: number;
  enableOn: string[];
  step: number;
  row: number;
  formData: any;
  setFormData: React.Dispatch<any>;
  saveFormData: () => void;
}) => {
  const onChangeHandler = (e: string | number, name: string, isFirstTextAreaInRow?: boolean) => {
    let newData = formData.map((r: any, index: number) => {
      if (index === row) {
        // if the first text area is empty, need to clear number dropdowns
        if (isFirstTextAreaInRow && e === '') {
          const numberOfNumDropdowns = columns.length - numberOfTextFields;
          if (numberOfNumDropdowns > 0) {
            const numDropdownColumns = columns.slice(-(numberOfNumDropdowns));
            const updatedFields = getColumnNamesInitialObject(numDropdownColumns);
            return { ...r, ...updatedFields, [name]: e };
          }
        }

        return { ...r, [name]: e ? e.toString() : e };
      } else {
        return r;
      }
    });

    setFormData(newData);
  };

  const selectStyles: StylesConfig<any, false> = {
    control: (base, state) => ({
      ...base,
      border: state.isFocused
        ? "1px solid #87949e !important"
        : "1px solid #bdc7cb",
    }),
  };

  return (
    <tr>
      {columns.map((c, index) => {
        const name = updateColumnNameToLabel(c);
        let attrs = {
          id: `power-row-${name}-${row}`,
          name,
        };
        const firstColumnNotFilled = !(formData?.[row]?.[updateColumnNameToLabel(columns[0])]);
        const textFieldStep = step < parseInt(enableOn[index]);
        let disabled = textFieldStep || firstColumnNotFilled;

        const displayNumberInput = index + 1 > numberOfTextFields;

        const numDropdownToolTip = firstColumnNotFilled && !textFieldStep ? { 'data-tip': 'Dropdown will be enabled when first column in row is filled.' } : {};

        return (
          <td
            key={`power-row-${name}-${row}`}
            className={clsx(
              displayNumberInput && "power-map__number-input",
              !displayNumberInput && "power-map__text-input"
            )}
          >
            {displayNumberInput ? (
              <div {...numDropdownToolTip}>
                <Select
                  {...attrs}
                  value={
                    formData?.[row]?.[name] ?
                      { value: parseInt(formData[row][name]), label: parseInt(formData[row][name]) } :
                      {}}
                  classNamePrefix="number-select"
                  options={[{ value: null, label: ' ' }, ...[...Array(10).keys()].map((num) => {
                    return { value: num + 1, label: num + 1 };
                  })]}
                  isDisabled={disabled}
                  onChange={(e) => onChangeHandler(e?.value, attrs.name)}
                  onBlur={saveFormData}
                  placeholder=""
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  styles={selectStyles}
                  menuPlacement="auto"
                />
              </div>
            ) : (
              <textarea
                {...attrs}
                value={formData?.[row]?.[name] || ''}
                onChange={(e) =>
                  onChangeHandler(e.currentTarget.value, attrs.name, index === 0)
                }
                onBlur={saveFormData}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
};
