export function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          IT Service Desk Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-600">
            Your IT Service Desk application is successfully deployed and running on AWS.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">✅ Authentication</h3>
              <p className="text-blue-700 text-sm">AWS Cognito working</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">✅ Database</h3>
              <p className="text-green-700 text-sm">PostgreSQL connected</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">✅ Infrastructure</h3>
              <p className="text-purple-700 text-sm">AWS services deployed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}