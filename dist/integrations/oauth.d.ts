/**
 * OAuth Integration Manager
 *
 * Provides one-click OAuth for GitHub, Slack, Gmail, Notion
 * with typed tool wrappers for each service.
 */
export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}
export interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    tokenType: string;
}
export interface OAuthProvider {
    name: string;
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    baseUrl: string;
}
export declare const OAUTH_PROVIDERS: Record<string, OAuthProvider>;
export declare class OAuthManager {
    private configs;
    private tokens;
    private state;
    constructor();
    /**
     * Configure an OAuth provider
     */
    configure(provider: string, config: OAuthConfig): void;
    /**
     * Generate authorization URL for a provider
     */
    getAuthUrl(provider: string, state?: string): string;
    /**
     * Handle OAuth callback and exchange code for tokens
     */
    handleCallback(provider: string, code: string, state: string): Promise<OAuthTokens>;
    /**
     * Get valid access token (refresh if needed)
     */
    getAccessToken(provider: string): Promise<string>;
    /**
     * Refresh access token
     */
    refreshToken(provider: string, refreshToken: string): Promise<void>;
    /**
     * Make authenticated API request
     */
    apiRequest(provider: string, endpoint: string, options?: RequestInit): Promise<any>;
    /**
     * Check if provider is connected
     */
    isConnected(provider: string): boolean;
    /**
     * Get connected providers
     */
    getConnectedProviders(): string[];
    /**
     * Disconnect provider
     */
    disconnect(provider: string): void;
    private generateState;
}
export default OAuthManager;
//# sourceMappingURL=oauth.d.ts.map