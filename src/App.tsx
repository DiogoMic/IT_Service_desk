import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider } from './lib/theme';
import { NewUserDashboard } from './components/NewUserDashboard';
import { NewITDashboard } from './components/NewITDashboard';

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
    },
    'custom:role': {
      label: 'Role:',
      placeholder: 'Select your role',
      isRequired: true,
      order: 5
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

export default function App() {
  return (
    <ThemeProvider>
      <Authenticator 
        formFields={formFields}
        components={components}
      >
        {({ signOut, user }) => (
          <main>
            <h1>Hello {user?.username}</h1>
            <button onClick={signOut}>Sign out</button>
            <NewUserDashboard />
          </main>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}
