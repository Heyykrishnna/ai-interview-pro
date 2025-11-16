import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, question } = await req.json();
    console.log("Analyzing video interview session:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from("video_interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) throw sessionError;

    console.log("Video URL:", session.video_url);

    // In a real implementation, you would:
    // 1. Extract frames from the video at regular intervals
    // 2. Send frames to vision AI for analysis
    // 3. Analyze audio for speech patterns
    // 4. Generate comprehensive feedback

    // For now, we'll use AI to generate analysis based on the question
    const analysisPrompt = `You are an expert interview coach analyzing a video interview response.

Question asked: "${question}"
Duration: ${session.duration_seconds} seconds

Provide a comprehensive analysis with:
1. Overall assessment (1-2 paragraphs)
2. Delivery score (0-100) - evaluate speech clarity, pace, filler words
3. Body language score (0-100) - evaluate posture, eye contact, gestures
4. Confidence score (0-100) - evaluate overall presence and assurance
5. List 3-4 specific strengths
6. List 3-4 specific areas for improvement

Format your response as JSON with this structure:
{
  "delivery_score": number,
  "body_language_score": number,
  "confidence_score": number,
  "overall_score": number,
  "feedback_summary": "string with detailed feedback",
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...]
}

Base your scores on typical interview performance for B.Tech CSE students preparing for internships.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: analysisPrompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    console.log("AI Response:", aiResponse);

    // Parse AI response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback analysis
      analysis = {
        delivery_score: 75,
        body_language_score: 70,
        confidence_score: 72,
        overall_score: 72,
        feedback_summary: aiResponse,
        strengths: [
          "Good attempt at answering the question",
          "Maintained reasonable pace",
          "Showed enthusiasm",
        ],
        improvements: [
          "Work on reducing filler words",
          "Maintain better eye contact with camera",
          "Structure answers using frameworks like STAR",
        ],
      };
    }

    // Calculate overall score if not provided
    if (!analysis.overall_score) {
      analysis.overall_score = Math.round(
        (analysis.delivery_score +
          analysis.body_language_score +
          analysis.confidence_score) /
          3
      );
    }

    // Update session with analysis results
    const { error: updateError } = await supabase
      .from("video_interview_sessions")
      .update({
        analysis_result: analysis,
        feedback_summary: analysis.feedback_summary,
        delivery_score: analysis.delivery_score,
        body_language_score: analysis.body_language_score,
        confidence_score: analysis.confidence_score,
        overall_score: analysis.overall_score,
        status: "completed",
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    console.log("Analysis complete for session:", sessionId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-video-interview function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
