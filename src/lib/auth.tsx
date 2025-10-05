import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, signIn as cognitoSignIn, signOut as cognitoSignOut, signUp as cognitoSignUp } from 'aws-amplify/auth';
import { api } from './supabase';

interface User {
  userId: string;
  username: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'it_team';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'user' | 'it_team') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser({ userId: currentUser.userId, username: currentUser.username });
      await fetchProfile(currentUser.userId);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const response = await api.get(`/profiles/${userId}`);
      setProfile(response.response.body);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    await cognitoSignIn({ username: email, password });
    await checkAuthState();
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'user' | 'it_team') => {
    await cognitoSignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name: fullName,
          'custom:role': role
        }
      }
    });
  };

  const signOut = async () => {
    await cognitoSignOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
