import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const query = `
  query {
    allQuestions {
      title
      titleSlug
      difficulty
      topicTags {
        name
      }
    }
  }
`

async function seed() {
    console.log('Fetching all problems from LeetCode...')

    const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    })

    const data = await res.json()
    const questions = data.data.allQuestions

    console.log(`Found ${questions.length} problems`)

    // Map to our schema
    const problems = questions.map(q => ({
        title: q.title,
        title_slug: q.titleSlug,
        difficulty: q.difficulty,
        topics: q.topicTags.map(t => t.name)
    }))

    // Insert in batches of 500
    const batchSize = 500
    for (let i = 0; i < problems.length; i += batchSize) {
        const batch = problems.slice(i, i + batchSize)
        const { error } = await supabaseAdmin
            .from('problems')
            .upsert(batch, { onConflict: 'title_slug' })

        if (error) {
            console.log(`Batch error at ${i}:`, error.message)
        } else {
            console.log(`✅ Inserted ${i + batch.length} / ${problems.length}`)
        }
    }

    console.log('🎉 All problems seeded!')
}

seed()