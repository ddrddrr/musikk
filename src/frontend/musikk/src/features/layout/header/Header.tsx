import { useAuth } from "@/features/auth/hooks/useAuth.ts";
import { SocialDropdown } from "@/features/layout/header/SocialDropdown.tsx";
import { NotificationBox } from "@/features/notifications/NotificationBox";
import { SearchBar } from "@/features/search/SearchBar.tsx";
import { Button } from "@/features/ui/button";
import { IconTooltip } from "@/features/ui/tooltip";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { Cog, Disc3, Upload, Users } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router-dom";

export const Header = memo(function Header() {
    const { user } = useAuth();

    // using grid here is easier than flexbox due to buttons aligment and spacing issues
    return (
        <header className="grid grid-cols-5 items-center bg-brand p-4 text-brand-foreground">
            <div className="col-span-1 flex justify-start gap-4">
                <IconTooltip label="Home">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Home"
                        className="text-brand-foreground"
                        asChild
                    >
                        <Link to="/">
                            <Disc3 />
                        </Link>
                    </Button>
                </IconTooltip>
                <SocialDropdown />
                <IconTooltip label="Social">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Social"
                        className="text-brand-foreground"
                        asChild
                    >
                        <Link to="/connections">
                            <Users />
                        </Link>
                    </Button>
                </IconTooltip>
            </div>

            <div className="col-span-3 flex items-center justify-start gap-4">
                <Link to="/" className="text-xl font-bold">
                    Musikk
                </Link>
                <SearchBar />
            </div>

            <div className="col-span-1 flex items-center justify-end gap-4">
                <IconTooltip label="Profile">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Profile"
                        className="hover:bg-brand-hover"
                        asChild
                    >
                        <Link to={`/users/${user?.uuid}`}>
                            <UserAvatar src={user?.avatar} alt={user?.display_name} size="sm" />
                        </Link>
                    </Button>
                </IconTooltip>
                <NotificationBox />
                <IconTooltip label="Settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Settings"
                        className="text-brand-foreground"
                        asChild
                    >
                        <Link to="/settings">
                            <Cog />
                        </Link>
                    </Button>
                </IconTooltip>

                {user?.is_artist && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-brand-foreground bg-transparent text-brand-foreground hover:bg-brand-hover"
                        asChild
                    >
                        <Link to="/upload">
                            <Upload className="mr-1 size-4" />
                            Upload
                        </Link>
                    </Button>
                )}
            </div>
        </header>
    );
});
