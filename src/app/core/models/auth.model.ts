export interface AuthStatusDTO {
  configured: boolean;
  authenticated: boolean;
  officer: boolean;
  discordId: string | null;
  username: string | null;
  displayName: string | null;
}
