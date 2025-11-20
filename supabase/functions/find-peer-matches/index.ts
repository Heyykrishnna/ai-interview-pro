import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchRequest {
    requesterId: string;
    skills: string[];
    experienceLevel?: string;
    topic?: string;
}

// Calculate skill match score between two users
function calculateSkillMatch(requesterSkills: string[], peerSkills: string[]): number {
    if (!requesterSkills || !peerSkills || requesterSkills.length === 0 || peerSkills.length === 0) {
        return 0;
    }

    const requesterSet = new Set(requesterSkills.map(s => s.toLowerCase()));
    const peerSet = new Set(peerSkills.map(s => s.toLowerCase()));

    let matchCount = 0;
    for (const skill of requesterSet) {
        if (peerSet.has(skill)) {
            matchCount++;
        }
    }

    // Calculate percentage match
    const matchPercentage = (matchCount / Math.max(requesterSet.size, peerSet.size)) * 100;
    return Math.round(matchPercentage);
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { requesterId, skills, experienceLevel, topic }: MatchRequest = await req.json()

        if (!requesterId || !skills || skills.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: requesterId and skills' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Get all active peer learning profiles except the requester
        const { data: profiles, error: profilesError } = await supabaseClient
            .from('peer_learning_profiles')
            .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
            .eq('is_active', true)
            .neq('user_id', requesterId)

        if (profilesError) {
            throw profilesError
        }

        if (!profiles || profiles.length === 0) {
            return new Response(
                JSON.stringify({
                    matches: [],
                    message: 'No active peer learners found. Encourage more users to create peer learning profiles!'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Calculate match scores for each profile
        const matchedProfiles = profiles
            .map(profile => {
                const skillScore = calculateSkillMatch(skills, profile.skills || [])

                // Bonus points for matching experience level
                let experienceBonus = 0
                if (experienceLevel && profile.experience_level === experienceLevel) {
                    experienceBonus = 20
                }

                // Bonus points for matching preferred topics
                let topicBonus = 0
                if (topic && profile.preferred_topics && profile.preferred_topics.includes(topic)) {
                    topicBonus = 15
                }

                const totalScore = skillScore + experienceBonus + topicBonus

                return {
                    userId: profile.user_id,
                    fullName: profile.profiles?.full_name || 'Anonymous',
                    email: profile.profiles?.email,
                    skills: profile.skills,
                    experienceLevel: profile.experience_level,
                    preferredTopics: profile.preferred_topics,
                    bio: profile.bio,
                    matchScore: totalScore,
                    skillMatchPercentage: skillScore,
                    matchedSkills: skills.filter(s =>
                        (profile.skills || []).some((ps: string) => ps.toLowerCase() === s.toLowerCase())
                    )
                }
            })
            .filter(match => match.matchScore > 0) // Only include profiles with some match
            .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
            .slice(0, 10) // Return top 10 matches

        return new Response(
            JSON.stringify({
                matches: matchedProfiles,
                totalMatches: matchedProfiles.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error in find-peer-matches:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
