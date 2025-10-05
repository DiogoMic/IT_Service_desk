import { get, post, put } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut, signUp } from 'aws-amplify/auth';

// API helper functions
export const api = {
  get: (path: string) => get({ apiName: 'itservicedesk', path }),
  post: (path: string, data: any) => post({ apiName: 'itservicedesk', path, options: { body: data } }),
  put: (path: string, data: any) => put({ apiName: 'itservicedesk', path, options: { body: data } })
};

// Auth helper functions
export const auth = {
  getCurrentUser,
  signIn,
  signOut,
  signUp
};
