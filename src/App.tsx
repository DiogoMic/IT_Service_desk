import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider } from './lib/theme';
import { SimpleDashboard } from './components/SimpleDashboard';

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
  // For now, default to user dashboard
  // TODO: Fetch user profile from database to determine role
  return (
    <div>
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <h1>Welcome {user?.username}</h1>
        <button 
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign out
        </button>
      </div>
      <SimpleDashboard />
    </div>
  );
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
