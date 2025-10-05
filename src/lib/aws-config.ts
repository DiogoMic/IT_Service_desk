import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
    }
  },
  API: {
    REST: {
      'itservicedesk': {
        endpoint: import.meta.env.VITE_API_URL,
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
      }
    }
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET,
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
    }
  }
};

Amplify.configure(awsConfig);

export default awsConfig;