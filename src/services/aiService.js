import * as FileSystem from 'expo-file-system/legacy';

function detectMediaType(base64) {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw')) return 'image/png';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('R0lG')) return 'image/gif';
  return 'image/jpeg';
}

async function readImageAsBase64(uri) {
  if (typeof window !== 'undefined' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

const API_URL = 'https://api.anthropic.com/v1/messages';

function getHeaders() {
  const raw = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
  const apiKey = raw.replace(/^["']|["']$/g, '');
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

export async function analyzeFoodImage(imageUri) {
  const base64 = await readImageAsBase64(imageUri);
  const mediaType = detectMediaType(base64);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Analyze this food image and estimate its nutritional content. Respond ONLY with valid JSON in this exact format, no other text:
{
  "foodName": "name of the food",
  "servingSize": "estimated serving size (e.g. 1 cup, 200g)",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>
}
Be as accurate as possible. If multiple foods are present, sum the totals.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await response.json();
  const text = data.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');
  return JSON.parse(jsonMatch[0]);
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

export async function calculateMacros({ weightKg, heightCm, age, gender, goal, activity }) {
  const ageVal = parseInt(age) || 25;
  const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.55;
  const activityLabel = {
    sedentary: 'sedentary (little or no exercise)',
    light: 'lightly active (1–2 days/week)',
    moderate: 'moderately active (3–5 days/week)',
    very: 'very active (6–7 days/week)',
  }[activity] || 'moderately active';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Calculate daily calorie and macronutrient targets for this person. Return ONLY raw JSON with no markdown, no code blocks, no explanation.

PERSON:
- Gender: ${gender}
- Age: ${ageVal} years
- Weight: ${weightKg.toFixed(1)} kg
- Height: ${heightCm.toFixed(0)} cm
- Activity level: ${activityLabel}
- Goal: ${goal}

USE THIS EXACT METHOD:
1. Mifflin-St Jeor BMR:
   ${gender === 'male'
     ? `Male: (10 × ${weightKg.toFixed(1)}) + (6.25 × ${heightCm.toFixed(0)}) - (5 × ${ageVal}) + 5`
     : `Female: (10 × ${weightKg.toFixed(1)}) + (6.25 × ${heightCm.toFixed(0)}) - (5 × ${ageVal}) - 161`}
2. TDEE = BMR × ${multiplier} (${activityLabel})
3. Adjust for goal:
   - maintaining: calories = TDEE
   - bulking: calories = TDEE + 400 (lean surplus)
   - cutting: calories = TDEE - 500 (moderate deficit, never below 1200 kcal)
4. Protein (prioritise muscle retention):
   - bulking: 2.2g × kg body weight
   - cutting: 2.4g × kg body weight (higher to preserve muscle in deficit)
   - maintaining: 1.8g × kg body weight
5. Fat: 25% of total calories ÷ 9 (minimum for hormone health)
6. Carbs: (total calories - protein×4 - fat×9) ÷ 4

OUTPUT — raw JSON only, no other text:
{"dailyCalorieGoal":<integer>,"dailyProteinGoal":<integer>,"dailyCarbsGoal":<integer>,"dailyFatGoal":<integer>,"summary":"<one sentence>"}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await response.json();
  const raw = data.content[0].text.trim();
  // Strip markdown code fences if Claude wraps the JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not parse AI response: ${cleaned.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}
