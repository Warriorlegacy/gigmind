import Groq from 'groq-sdk'

async function test() {
  console.log('GROQ_API_KEY defined:', !!process.env.GROQ_API_KEY)
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not defined')
    return
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Write a 1-sentence bio for a plumber named Mario.' }],
      model: 'llama-3.1-8b-instant',
    })
    console.log('Success:', completion.choices[0]?.message?.content)
  } catch (err) {
    console.error('Error Details:', err)
  }
}

test()
