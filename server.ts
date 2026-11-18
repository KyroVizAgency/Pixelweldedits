import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ChatTurnInput {
  role: 'user' | 'model';
  text: string;
}

interface GroundingSource {
  title: string;
  uri: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Low-latency project pacing & cut recommender using gemini-3.1-flash-lite
  app.post('/api/studio/pacing-brief', async (req, res) => {
    try {
      const { concept, format } = req.body as {
        concept?: string;
        format?: string;
      };

      if (!concept || typeof concept !== 'string' || concept.trim().length < 4) {
        return res.status(400).json({
          error: 'Please enter a short description of your video concept.',
        });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error:
            'Gemini API key is not configured yet. Add GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Project concept: ${concept.trim()}\nPreferred format: ${format || 'Flexible'}`,
        config: {
          systemInstruction:
            'You are the Lead Post-Production Producer at Pixelweldedits, a cinematic video editing studio. Analyze the client video concept and return a concise, practical editing plan covering ideal runtime, cut pacing rhythm, aspect ratios, sound/color direction, and recommended Pixelweldedits service category (choose from: Short-form Video Editing, Reels & Social Media Content, Cinematic Video Editing, Promotional Videos, Motion Graphics, YouTube Video Editing). Keep every field sharp and realistic.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedService: { type: Type.STRING },
              idealRuntime: { type: Type.STRING },
              pacingRhythm: { type: Type.STRING },
              aspectRatios: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              editorialApproach: { type: Type.STRING },
              soundAndGrade: { type: Type.STRING },
              deliverables: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'recommendedService',
              'idealRuntime',
              'pacingRhythm',
              'aspectRatios',
              'editorialApproach',
              'soundAndGrade',
              'deliverables',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? '{}');
      return res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate pacing brief';
      console.error('[pacing-brief error]', message);
      return res.status(500).json({ error: message });
    }
  });

  // Multi-turn Creative Producer Chat using gemini-4-hydrogen with optional Google Search grounding
  app.post('/api/studio/producer-chat', async (req, res) => {
    try {
      const { messages, useSearch } = req.body as {
        messages?: ChatTurnInput[];
        useSearch?: boolean;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error:
            'Gemini API key is not configured yet. Add GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));
      const latest = messages[messages.length - 1];

      const chat = ai.chats.create({
        model: 'gemini-4-hydrogen',
        history,
        config: {
          systemInstruction:
            'You are the Senior Creative Producer at Pixelweldedits, an independent cinematic video editing studio. You help prospective clients scope video edits across Short-form Video Editing, Reels & Social Media Content, Cinematic Video Editing, Promotional Videos, Motion Graphics, and YouTube Video Editing. Give clear, concise, craft-focused advice on narrative structure, pacing, aspect ratios, deliverables, and post-production workflows. Never invent fake past clients, awards, or fake testimonials for Pixelweldedits. Keep answers crisp (under 180 words unless asked for a detailed shot-list breakdown).',
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      const response = await chat.sendMessage({ message: latest.text });

      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources: GroundingSource[] = [];
      const seenUris = new Set<string>();
      for (const chunk of chunks) {
        const web = chunk.web;
        if (web?.uri && !seenUris.has(web.uri)) {
          seenUris.add(web.uri);
          sources.push({
            title: web.title || web.uri,
            uri: web.uri,
          });
        }
      }

      return res.json({
        reply: response.text ?? 'I am ready to help scope your edit.',
        sources,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Creative producer chat failed';
      console.error('[producer-chat error]', message);
      return res.status(500).json({ error: message });
    }
  });

  // Project inquiry submission endpoint
  app.post('/api/inquiries', (req, res) => {
    const { name, email, service, timeline, notes } = req.body as {
      name?: string;
      email?: string;
      service?: string;
      timeline?: string;
      notes?: string;
    };

    if (!name?.trim() || !email?.trim() || !notes?.trim()) {
      return res.status(400).json({
        error: 'Name, email, and project details are required.',
      });
    }

    const referenceId = `PW-${Date.now().toString(36).toUpperCase()}`;
    return res.status(201).json({
      referenceId,
      receivedAt: new Date().toISOString(),
      summary: {
        name: name.trim(),
        email: email.trim(),
        service: service || 'Cinematic Video Editing',
        timeline: timeline || 'Flexible',
      },
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pixelweldedits server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
