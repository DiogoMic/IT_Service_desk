/*
  # IT Service Desk Database Schema

  ## Overview
  Complete database schema for IT service desk application with ticket management,
  chat functionality, feedback system, and SLA tracking.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, FK to auth.users) - User ID
  - `email` (text) - User email
  - `full_name` (text) - Full name
  - `role` (text) - Role: 'user' or 'it_team'
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. `ticket_categories`
  Categories for tickets with SLA resolution times
  - `id` (uuid, PK) - Category ID
  - `name` (text) - Category name (e.g., Hardware, Software, Network)
  - `description` (text) - Category description
  - `resolution_time_hours` (integer) - Expected resolution time in hours
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `tickets`
  Main ticket tracking table
  - `id` (uuid, PK) - Ticket ID
  - `ticket_number` (text, unique) - Human-readable ticket number
  - `user_id` (uuid, FK) - User who created the ticket
  - `category_id` (uuid, FK) - Ticket category
  - `title` (text) - Ticket title
  - `description` (text) - Detailed description
  - `status` (text) - Status: 'new', 'in_progress', 'resolved', 'closed'
  - `priority` (text) - Priority: 'low', 'medium', 'high', 'critical'
  - `assigned_to` (uuid, FK) - IT team member assigned
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `resolved_at` (timestamptz) - Resolution timestamp
  - `closed_at` (timestamptz) - Closure timestamp
  - `sla_due_date` (timestamptz) - SLA deadline
  - `sla_breached` (boolean) - Whether SLA was breached

  ### 4. `ticket_attachments`
  File attachments for tickets
  - `id` (uuid, PK) - Attachment ID
  - `ticket_id` (uuid, FK) - Related ticket
  - `file_name` (text) - Original file name
  - `file_path` (text) - Storage path
  - `file_size` (bigint) - File size in bytes
  - `mime_type` (text) - File MIME type
  - `uploaded_by` (uuid, FK) - User who uploaded
  - `created_at` (timestamptz) - Upload timestamp

  ### 5. `ticket_chat_messages`
  Real-time chat messages within tickets
  - `id` (uuid, PK) - Message ID
  - `ticket_id` (uuid, FK) - Related ticket
  - `user_id` (uuid, FK) - Message sender
  - `message` (text) - Message content
  - `created_at` (timestamptz) - Message timestamp

  ### 6. `ticket_assignments`
  History of ticket assignments
  - `id` (uuid, PK) - Assignment ID
  - `ticket_id` (uuid, FK) - Related ticket
  - `assigned_to` (uuid, FK) - IT team member
  - `assigned_by` (uuid, FK) - User who made assignment
  - `created_at` (timestamptz) - Assignment timestamp

  ### 7. `ticket_feedback`
  Customer satisfaction feedback
  - `id` (uuid, PK) - Feedback ID
  - `ticket_id` (uuid, FK) - Related ticket
  - `user_id` (uuid, FK) - User providing feedback
  - `rating` (integer) - Rating 1-5
  - `comments` (text) - Additional comments
  - `created_at` (timestamptz) - Feedback timestamp

  ## Security
  - Enable RLS on all tables
  - Users can view/edit their own profiles
  - Users can create tickets and view their own tickets
  - Users can add attachments to their tickets
  - Users can chat on their tickets
  - IT team can view all tickets and manage assignments
  - IT team can view all data for reporting
  - Only ticket creators can submit feedback for their tickets

  ## Notes
  - Ticket numbers are auto-generated with format: TICK-YYYYMMDD-XXXX
  - SLA due dates are calculated based on category resolution time
  - Status automatically changes to 'in_progress' when ticket is assigned
  - Storage bucket for attachments will be created separately
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for ticket_categories
CREATE POLICY "Anyone can view categories"
  ON ticket_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only IT team can manage categories"
  ON ticket_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  );

-- RLS Policies for tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  );

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Ticket owners and IT team can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  );

-- RLS Policies for ticket_attachments
CREATE POLICY "Users can view attachments for their tickets"
  ON ticket_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_attachments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'it_team'
        )
      )
    )
  );

CREATE POLICY "Users can add attachments to their tickets"
  ON ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_attachments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'it_team'
        )
      )
    )
  );

-- RLS Policies for ticket_chat_messages
CREATE POLICY "Users can view chat for their tickets"
  ON ticket_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_chat_messages.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'it_team'
        )
      )
    )
  );

CREATE POLICY "Users can send messages in their tickets"
  ON ticket_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_chat_messages.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'it_team'
        )
      )
    )
  );

-- RLS Policies for ticket_assignments
CREATE POLICY "IT team and involved users can view assignments"
  ON ticket_assignments FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_assignments.ticket_id
      AND tickets.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  );

CREATE POLICY "Only IT team can create assignments"
  ON ticket_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  );

-- RLS Policies for ticket_feedback
CREATE POLICY "Users can view feedback for their tickets"
  ON ticket_feedback FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'it_team'
    )
  );

CREATE POLICY "Users can submit feedback for their closed tickets"
  ON ticket_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_feedback.ticket_id
      AND tickets.user_id = auth.uid()
      AND tickets.status = 'closed'
    )
  );

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