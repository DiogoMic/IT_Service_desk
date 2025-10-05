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

    console.log(`Sending feedback request for ticket ${ticketNumber}`);

    const emailBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Ticket Closed - Feedback Requested</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Your support ticket has been closed. We would greatly appreciate your feedback on the service you received.</p>
              <div class="ticket-info">
                <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
                <p><strong>Title:</strong> ${title}</p>
              </div>
              <p>Please log in to the IT Service Desk to provide your feedback and help us improve our service.</p>
            </div>
            <div class="footer">
              <p>Thank you for using the IT Service Desk</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Feedback request logged successfully",
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
    console.error("Error in send-feedback-request:", error);
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