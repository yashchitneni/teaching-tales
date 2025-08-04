import { CognitoIdentityProviderClient, GetUserCommand, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { NextRequest } from "next/server";
import { db } from "@/lib/supabase"; // We'll still use Supabase for database

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// User type definitions
export type UserRole = "parent" | "admin";

export interface CognitoUser {
  id: string;
  email: string;
  cognitoId: string;
  role: UserRole;
  name?: string;
}

// Validate Cognito access token
export async function validateCognitoToken(token: string): Promise<CognitoUser | null> {
  try {
    const command = new GetUserCommand({
      AccessToken: token,
    });

    const response = await cognitoClient.send(command);

    if (!response.Username || !response.UserAttributes) {
      return null;
    }

    // Extract user attributes
    const email = response.UserAttributes.find(attr => attr.Name === "email")?.Value;
    const name = response.UserAttributes.find(attr => attr.Name === "name")?.Value;
    const role = response.UserAttributes.find(attr => attr.Name === "custom:role")?.Value as UserRole || "parent";

    if (!email) {
      return null;
    }

    // Look up user in our database
    const { data: profile } = await db.getProfile(response.Username);
    
    // If user doesn't exist in our DB, create them
    if (!profile) {
      const { data: newProfile, error } = await db
        .from('profiles')
        .insert({
          id: response.Username,
          email,
          display_name: name || email.split('@')[0],
          cognito_id: response.Username,
          role: role,
          subscription_tier: 'free',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        cognitoId: response.Username,
        role: role,
        name: newProfile.display_name,
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      cognitoId: response.Username,
      role: profile.role || role,
      name: profile.display_name,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

// Extract token from request
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies (for SSO)
  const cookieToken = request.cookies.get('cognito-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

// Login with Cognito
export async function loginWithCognito(email: string, password: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Authentication failed");
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken!,
      expiresIn: response.AuthenticationResult.ExpiresIn!,
      tokenType: response.AuthenticationResult.TokenType!,
    };
  } catch (error: any) {
    // Handle specific Cognito errors
    if (error.name === "NotAuthorizedException") {
      throw new Error("Invalid email or password");
    }
    if (error.name === "UserNotFoundException") {
      throw new Error("Invalid email or password"); // Don't reveal user doesn't exist
    }
    if (error.name === "PasswordResetRequiredException") {
      throw new Error("Password reset required");
    }
    throw error;
  }
}

// Refresh token
export async function refreshCognitoToken(refreshToken: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Token refresh failed");
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      expiresIn: response.AuthenticationResult.ExpiresIn!,
      tokenType: response.AuthenticationResult.TokenType!,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

// Role-based access control helper
export function hasRole(user: CognitoUser | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

// Generate SSO cookie options
export function getSSOCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    ...(process.env.SSO_COOKIE_DOMAIN && {
      domain: process.env.SSO_COOKIE_DOMAIN
    })
  };
}