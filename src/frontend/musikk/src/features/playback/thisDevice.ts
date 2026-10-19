import { getWebPlayerLabel } from "@/utils/getWebPlayerLabel.ts";

export interface ThisDevice {
    id: string;
    name: string;
}

// not kept in sessionStorage because "Duplicate tab" copies it,
// so two tabs would get the same device id
export const THIS_DEVICE: ThisDevice = {
    id: crypto.randomUUID(),
    name: getWebPlayerLabel(),
};
