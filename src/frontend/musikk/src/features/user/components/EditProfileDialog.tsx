import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/features/ui/dialog.tsx";
import { ProfileForm } from "@/features/user/components/ProfileForm.tsx";
import { ReactElement } from "react";

export function EditProfileDialog({ trigger }: { trigger: ReactElement }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <ProfileForm />
            </DialogContent>
        </Dialog>
    );
}
