import { SocialDropdown } from "@/features/layout/header/SocialDropdown.tsx";
import { NotificationBox } from "@/features/notifications/NotificationBox";
import { SearchBar } from "@/features/search/SearchBar.tsx";
import { Button } from "@/features/ui/button";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { useAuth } from "@/hooks/useAuth";
import { Cog, Disc3, Upload, Users } from "lucide-react";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

export const Header = memo(function Header() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // using grid here is easier than flexbox due to buttons aligment and spacing issues
    return (
        <header className="grid grid-cols-5 items-center bg-brand p-4 text-brand-foreground">
            <div className="col-span-1 flex justify-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-brand-foreground"
                    onClick={() => void navigate("/")}
                >
                    <Disc3 />
                </Button>
                <SocialDropdown />
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-brand-foreground"
                    onClick={() => void navigate(`/users/${user?.uuid}/connections`)}
                >
                    <Users />
                </Button>
            </div>

            <div className="col-span-3 flex items-center justify-start gap-4">
                <button
                    type="button"
                    className="cursor-pointer text-xl font-bold"
                    onClick={() => void navigate("/")}
                >
                    Musikk
                </button>
                <SearchBar />
            </div>

            <div className="col-span-1 flex items-center justify-end gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-brand-hover"
                    onClick={() => void navigate(`/users/${user?.uuid}`)}
                >
                    <UserAvatar src={user?.avatar} alt={user?.display_name} size="sm" />
                </Button>
                <NotificationBox />
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-brand-foreground"
                    onClick={() => void navigate("/settings")}
                >
                    <Cog />
                </Button>

                {user?.is_artist && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-brand-foreground bg-transparent text-brand-foreground hover:bg-brand-hover"
                        onClick={() => void navigate("/upload")}
                    >
                        <Upload className="mr-1 size-4" />
                        Upload
                    </Button>
                )}
            </div>
        </header>
    );
});
