"use client";

import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

export type BmuType = {
  sectionName: string;
  units: {
    value: string;
  }[];
};

const bmuMockData = [
  {
    sectionName: "Mozambique",
    units: [
      { value: "Coastal Conservation Zone" },
      { value: "Sandy Shores Management Area" },
      { value: "Oceanfront Ecological Unit" },
      { value: "Beach Access and Preservation Unit" },
    ],
  },
  {
    sectionName: "Timor",
    units: [
      { value: "Seaside Recreation Zone" },
      { value: "Marine Wildlife Sanctuary" },
      { value: "Shoreline Monitoring Unit" },
      { value: "Beach Visitor Services Area" },
    ],
  },
];

const initialData = {
  bmuFilter: [] as string[],
  setBmuFilter: () => {},
  bmuOriginalData: [] as BmuType[],
};

const GlobalFilterContext = React.createContext<{
  bmuFilter: string[];
  setBmuFilter: (data: string[]) => void;
  bmuOriginalData: BmuType[];
}>(initialData);

export const GlobalFilterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [bmuOriginalData, setBmuOriginalData] = useState<BmuType[]>([]);
  const [bmuFilter, setBmuFilter] = useState([] as string[]);

  useEffect(() => {
    // API call to DB query here.bmuMockData will be replaced with the actual data
    setBmuOriginalData(bmuMockData);
    setBmuFilter(
      bmuMockData.flatMap((bmu) => bmu.units.map((unit) => unit.value))
    );

    Cookies.set(
      "bmuFilter",
      JSON.stringify(
        bmuMockData.flatMap((bmu) => bmu.units.map((unit) => unit.value))
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmuMockData]);

  const setFilter = (data: string[]) => {
    const filterData = data.filter(function (item, pos) {
      return data.indexOf(item) === pos;
    });
    setBmuFilter(filterData);
    Cookies.set("bmuFilter", JSON.stringify(filterData));
  };

  return (
    <GlobalFilterContext.Provider
      value={{ bmuFilter, setBmuFilter: setFilter, bmuOriginalData }}
    >
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => {
  return useContext(GlobalFilterContext);
};
