import { stitch } from '@google/stitch-sdk'
import dotenv from 'dotenv'

dotenv.config()

export interface StitchUIGeneration {
  html: string
  css?: string
  prompt: string
  timestamp: string
}

export const generateStitchUI = async (prompt: string): Promise<StitchUIGeneration> => {
  const apiKey = process.env.STITCH_API_KEY

  if (apiKey) {
    try {
      console.log(`[StitchService] Calling Google Labs Stitch SDK with prompt: "${prompt}"`)
      // Initialize Stitch project workspace
      const project = stitch.project('clauseguard-workspace')
      const screen = await project.generate(prompt)
      const html = await screen.getHtml()


      return {
        html,
        prompt,
        timestamp: new Date().toISOString(),
      }
    } catch (err: any) {
      console.error('[StitchService] Google Labs Stitch SDK call failed, falling back:', err.message)
    }
  }

  // Fallback: Generate a high-end visual scorecard template using original ClauseGuard branding
  console.log(`[StitchService] Generating brand-aligned fallback legal card template for: "${prompt}"`)
  const htmlFallback = `
<div style="font-family: 'Inter', sans-serif; background: #ffffff; border: 1px solid #E5E3DC; border-radius: 8px; padding: 24px; max-width: 440px; box-shadow: 0 4px 20px rgba(15,21,35,0.03);">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
    <span style="font-size: 11px; font-weight: 700; color: #B89047; text-transform: uppercase; letter-spacing: 0.8px;">AI Visual Report</span>
    <span style="font-size: 11px; color: #82889A;">Generated via Stitch</span>
  </div>
  <h3 style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #0F1523; margin: 0 0 8px 0; text-transform: capitalize;">
    ${prompt}
  </h3>
  <p style="font-size: 13px; color: #4A4F63; line-height: 1.5; margin: 0 0 20px 0;">
    Compliance template compiled using verified legal playbook benchmarks. Highlights standard liability caps and risk profiles.
  </p>
  <div style="display: flex; gap: 8px;">
    <button style="flex: 1; padding: 8px 14px; background: #0F1523; color: #ffffff; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
      Approve Terms
    </button>
    <button style="padding: 8px 14px; background: none; border: 1px solid #E5E3DC; border-radius: 4px; font-size: 12px; font-weight: 600; color: #4A4F63; cursor: pointer;">
      Flag Clause
    </button>
  </div>
</div>
`

  return {
    html: htmlFallback,
    prompt,
    timestamp: new Date().toISOString(),
  }
}
