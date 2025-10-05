import json
import psycopg2
import os

def handler(event, context):
    """
    Cognito Post Confirmation Trigger
    Creates user profile in database after successful sign-up
    """
    
    try:
        # Get user attributes from Cognito event
        user_attributes = event['request']['userAttributes']
        cognito_user_id = event['userName']
        email = user_attributes.get('email')
        full_name = user_attributes.get('name')
        role = user_attributes.get('custom:role', 'user')
        
        # Connect to database
        conn = psycopg2.connect(
            host=os.environ['DB_HOST'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD']
        )
        
        cursor = conn.cursor()
        
        # Insert user profile
        cursor.execute("""
            INSERT INTO profiles (cognito_user_id, email, full_name, role)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (cognito_user_id) DO NOTHING
        """, (cognito_user_id, email, full_name, role))
        
        conn.commit()
        conn.close()
        
        return event
        
    except Exception as e:
        print(f"Error creating user profile: {str(e)}")
        # Don't fail the sign-up process
        return event