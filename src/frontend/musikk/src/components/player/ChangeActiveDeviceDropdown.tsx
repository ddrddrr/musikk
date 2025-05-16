import { Button } from "@/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useHandleSwitchDevice } from "@/hooks/useHandleSwitchDevice.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { Computer } from "lucide-react";
import { useContext } from "react";

export function ChangeActiveDeviceDropdown() {
    const { playbackState } = useContext(PlaybackContext);
    const handleSwitchDevice = useHandleSwitchDevice();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Computer className="size-5" strokeWidth="2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {playbackState?.devices.map((device) => (
                    <DropdownMenuItem
                        key={device.uuid}
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
