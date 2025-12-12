import { useDeviceList } from "@/modules/playback/hooks/useDeviceList.ts";
import { useHandleSwitchDevice } from "@/modules/playback/hooks/useHandleSwitchDevice.ts";
import { Button } from "@/modules/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/modules/ui/dropdown-menu.tsx";
import { Computer } from "lucide-react";

export function ChangeActiveDeviceDropdown() {
    const { deviceList } = useDeviceList();
    const handleSwitchDevice = useHandleSwitchDevice();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Computer className="size-5" strokeWidth="2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {deviceList.map((device) => (
                    <DropdownMenuItem
                        key={device.id}
                        onClick={() => {
                            if (!device.is_active) {
                                handleSwitchDevice(device);
                            }
                        }}
                        className={device.is_active ? "font-semibold bg-muted" : ""}
                    >
                        {device.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
