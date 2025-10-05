import json
import psycopg2
import boto3
import os

sns = boto3.client('sns')

def handler(event, context):
    try:
        body = json.loads(event['body'])
        ticket_id = event['pathParameters']['id']
        
        conn = psycopg2.connect(
            host=os.environ['DB_HOST'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD']
        )
        
        cursor = conn.cursor()
        
        # Get current ticket data
        cursor.execute("""
            SELECT t.*, p.full_name, p.email, assigned_p.full_name as assigned_name
            FROM tickets t
            JOIN profiles p ON t.user_id = p.id
            LEFT JOIN profiles assigned_p ON t.assigned_to = assigned_p.id
            WHERE t.id = %s
        """, (ticket_id,))
        
        old_ticket = cursor.fetchone()
        
        # Update ticket
        update_fields = []
        values = []
        
        if 'status' in body:
            update_fields.append('status = %s')
            values.append(body['status'])
        
        if 'assigned_to' in body:
            update_fields.append('assigned_to = %s')
            values.append(body['assigned_to'])
        
        if 'priority' in body:
            update_fields.append('priority = %s')
            values.append(body['priority'])
        
        values.append(ticket_id)
        
        cursor.execute(f"""
            UPDATE tickets SET {', '.join(update_fields)}, updated_at = now()
            WHERE id = %s
            RETURNING *
        """, values)
        
        updated_ticket = cursor.fetchone()
        
        # Check for assignment change
        if 'assigned_to' in body and body['assigned_to'] != old_ticket[9]:
            cursor.execute("SELECT full_name FROM profiles WHERE id = %s", (body['assigned_to'],))
            assigned_user = cursor.fetchone()
            
            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Message=json.dumps({
                    'type': 'ticket_assigned',
                    'ticket_id': ticket_id,
                    'ticket_number': old_ticket[1],
                    'title': old_ticket[4],
                    'user_email': old_ticket[11],
                    'assigned_to_name': assigned_user[0] if assigned_user else 'Unknown'
                })
            )
        
        # Check for resolution
        if 'status' in body and body['status'] == 'resolved' and old_ticket[6] != 'resolved':
            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Message=json.dumps({
                    'type': 'ticket_resolved',
                    'ticket_id': ticket_id,
                    'ticket_number': old_ticket[1],
                    'title': old_ticket[4],
                    'user_email': old_ticket[11]
                })
            )
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'success': True})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }