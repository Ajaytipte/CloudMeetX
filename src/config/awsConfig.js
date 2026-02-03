/**
 * AWS Amplify Configuration
 * Configures AWS Cognito for user authentication
 */

const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: 'ap-south-1_TtWbXB2Mz',
            userPoolClientId: '1io0ioohfm2d7ps2fpsjso79l',
            region: 'ap-south-1',
            // Optional: Configure sign-up attributes
            signUpAttributes: ['email', 'name', 'phone_number'],
            // Optional: Password policy
            passwordFormat: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialCharacters: true,
            },
        }
    }
};

export default awsConfig;
