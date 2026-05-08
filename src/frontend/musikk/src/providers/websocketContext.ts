import { WSClient } from "@/ws/client.ts";
import { createContext } from "react";

export const WSContext = createContext<WSClient | null>(null);
