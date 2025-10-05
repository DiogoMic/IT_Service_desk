import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider } from './lib/theme';
import { NewUserDashboard } from './components/NewUserDashboard';
import { NewITDashboard } from './components/NewITDashboard';
import { api } from './lib/supabase';

const formFields = {
  signUp: {
    name: {
      label: 'Full Name:',
      placeholder: 'Enter your full name',
      isRequired: true,
      order: 1
    },
    email: {
      label: 'Email:',
      placeholder: 'Enter your email',
      isRequired: true,
      order: 2
    },
    password: {
      label: 'Password:',
      placeholder: 'Enter your password',
      isRequired: true,
      order: 3
    },
    confirm_password: {
      label: 'Confirm Password:',
      order: 4
    }
  }
};

const components = {
  SignUp: {
    FormFields() {
      return (
        <>
          <Authenticator.SignUp.FormFields />
          <div className="amplify-field amplify-field-group">
            <label className="amplify-label">Role:</label>
            <select 
              name="custom:role" 
              className="amplify-input"
              required
            >
              <option value="">Select your role</option>
              <option value="user">User</option>
              <option value="it_team">IT Team</option>
            </select>
          </div>
        </>
      );
    }
  }
};

function AppContent({ signOut, user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.userId);
    }
  }, [user]);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await api.get(`/profiles/${userId}`);
      setProfile(response.response.body);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-4 animate-pulse">
            <span className="text-3xl">🎫</span>
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return profile?.role === 'it_team' ? 
    <NewITDashboard user={user} profile={profile} signOut={signOut} /> : 
    <NewUserDashboard user={user} profile={profile} signOut={signOut} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <Authenticator 
        formFields={formFields}
        components={components}
      >
        {({ signOut, user }) => (
          <AppContent signOut={signOut} user={user} />
        )}
      </Authenticator>
    </ThemeProvider>
  );
}
