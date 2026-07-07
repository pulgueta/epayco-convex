import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LogOut, Receipt, Repeat } from "lucide-react";
import { api } from "@cvx/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Me } from "@/lib/types";

export function AccountMenu() {
	const { signOut } = useAuthActions();
	const me = useQuery(api.account.getMe) as Me | undefined;
	const email = me?.email ?? null;
	const initial = (email ?? "?").charAt(0).toUpperCase();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full"
					aria-label="Account menu"
				>
					<Avatar className="size-7">
						<AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
							{initial}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<span className="block text-xs text-muted-foreground">
						Signed in as
					</span>
					<span className="block truncate">{email ?? "your account"}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/account">
						<Receipt />
						Orders &amp; cards
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link to="/plans">
						<Repeat />
						Coffee Club
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onSelect={() => void signOut()}
				>
					<LogOut />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
