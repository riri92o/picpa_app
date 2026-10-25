import { createContext, useContext } from "react";
import type { Appearance } from "./appearance";

export const AppearanceContext = createContext<Appearance>("day");
export const useAppearance = () => useContext(AppearanceContext);
