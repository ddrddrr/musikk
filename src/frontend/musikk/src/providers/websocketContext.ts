import { WSClient } from "@/websockets/client.ts";
import { createContext } from "react";

export const WSContext = createContext<WSClient | null>(null);
