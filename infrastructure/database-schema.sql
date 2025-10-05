-- IT Service Desk Database Schema for AWS RDS PostgreSQL
-- Run this after the CloudFormation stack is deployed

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_user_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'it_team')),
  created_at timestamptz DEFAULT now()
);

-- Create ticket categories table
CREATE TABLE IF NOT EXISTS ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  resolution_time_hours integer NOT NULL DEFAULT 24,
  created_at timestamptz DEFAULT now()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES ticket_categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  sla_due_date timestamptz NOT NULL,
  sla_breached boolean DEFAULT false
);

-- Create ticket attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create ticket chat messages table
CREATE TABLE IF NOT EXISTS ticket_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ticket assignments table
CREATE TABLE IF NOT EXISTS ticket_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create ticket feedback table
CREATE TABLE IF NOT EXISTS ticket_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_chat_messages_ticket_id ON ticket_chat_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket_id ON ticket_assignments(ticket_id);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_date text;
  ticket_count integer;
  new_number text;
BEGIN
  ticket_date := to_char(now(), 'YYYYMMDD');
  
  SELECT COUNT(*) INTO ticket_count
  FROM tickets
  WHERE ticket_number LIKE 'TICK-' || ticket_date || '-%';
  
  new_number := 'TICK-' || ticket_date || '-' || LPAD((ticket_count + 1)::text, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Function to calculate SLA due date
CREATE OR REPLACE FUNCTION calculate_sla_due_date(category_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  resolution_hours integer;
BEGIN
  SELECT resolution_time_hours INTO resolution_hours
  FROM ticket_categories
  WHERE id = category_id;
  
  RETURN now() + (resolution_hours || ' hours')::interval;
END;
$$;

-- Trigger to auto-generate ticket number and set SLA due date
CREATE OR REPLACE FUNCTION set_ticket_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  
  IF NEW.sla_due_date IS NULL THEN
    NEW.sla_due_date := calculate_sla_due_date(NEW.category_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_ticket_defaults
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_defaults();

-- Trigger to update ticket status when assigned
CREATE OR REPLACE FUNCTION update_ticket_status_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS NULL THEN
    NEW.status := 'in_progress';
  END IF;
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_status_on_assignment
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_status_on_assignment();

-- Trigger to check SLA breach
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'resolved' OR NEW.status = 'closed' THEN
    IF NEW.status = 'resolved' AND NEW.resolved_at IS NULL THEN
      NEW.resolved_at := now();
    END IF;
    
    IF NEW.status = 'closed' AND NEW.closed_at IS NULL THEN
      NEW.closed_at := now();
    END IF;
    
    IF COALESCE(NEW.resolved_at, NEW.closed_at, now()) > NEW.sla_due_date THEN
      NEW.sla_breached := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_sla_breach
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION check_sla_breach();

-- Insert default categories
INSERT INTO ticket_categories (name, description, resolution_time_hours) VALUES
  ('Hardware', 'Issues related to physical equipment (computers, printers, monitors, etc.)', 48),
  ('Software', 'Software installation, updates, and application issues', 24),
  ('Network', 'Network connectivity, WiFi, and internet access issues', 8),
  ('Access & Permissions', 'Account access, password resets, and permission requests', 4),
  ('Email', 'Email configuration, delivery issues, and mailbox problems', 12),
  ('Other', 'General IT support requests', 24)
ON CONFLICT (name) DO NOTHING;