import { EmptyState } from "@/features/common/EmptyState.tsx";
import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { useHandleSwitchDevice } from "@/features/playback/hooks/useHandleSwitchDevice.ts";
import { Button } from "@/features/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { Computer } from "lucide-react";

export function ChangeActiveDeviceDropdown() {
    const { deviceList } = useDeviceList();
    const handleSwitchDevice = useHandleSwitchDevice();
    return (
        <DropdownMenu>
            <IconTooltip label="Devices" side="top">
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Devices">
                        <Computer className="size-5" strokeWidth="2" />
                    </Button>
                </DropdownMenuTrigger>
            </IconTooltip>
            <DropdownMenuContent align="end">
                {deviceList.length === 0 && (
                    <EmptyState
                        variant="inline"
                        message="No devices available"
                        className="px-4 py-2"
                    />
                )}
                {deviceList.map((device) => (
                    <DropdownMenuItem
                        key={device.id}
                        onClick={() => {
                            if (!device.is_active) {
                                handleSwitchDevice(device);
                            }
                        }}
                        className={device.is_active ? "bg-muted font-semibold" : ""}
                    >
                        {device.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
