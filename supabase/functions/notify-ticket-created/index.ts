import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { ticketId, ticketNumber, title, userEmail, userName } = await req.json();

    console.log(`Sending notification for ticket ${ticketNumber}`);

    const emailBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 New Support Ticket Created</h1>
            </div>
            <div class="content">
              <p>Hello IT Team,</p>
              <p>A new support ticket has been created and requires attention.</p>
              <div class="ticket-info">
                <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Submitted by:</strong> ${userName} (${userEmail})</p>
              </div>
              <p>Please log in to the IT Service Desk to review and assign this ticket.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from the IT Service Desk</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification logged successfully",
        ticketNumber 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in notify-ticket-created:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});