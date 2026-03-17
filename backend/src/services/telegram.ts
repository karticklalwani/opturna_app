import type { AnalysisResult } from "./signal-engine.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function formatSignalMessage(analysis: AnalysisResult): string {
  const dirIcon = analysis.signal === "BUY" ? "🟢" : analysis.signal === "SELL" ? "🔴" : "🟡";
  const riskIcon = analysis.riskLevel === "low" ? "🟢" : analysis.riskLevel === "medium" ? "🟡" : "🔴";
  const timeStr = new Date(analysis.lastSignalTimestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  const fmt = (n: number) => n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  let msg = `⚡ *OPTURNA SIGNAL ALERT*\n\n`;
  msg += `${dirIcon} *Señal: ${analysis.signal}*\n`;
  msg += `📊 Activo: \`${analysis.symbol}\`\n`;
  msg += `⏰ Hora: ${timeStr} UTC\n`;
  msg += `💰 Precio de referencia: \`${fmt(analysis.entryPrice)} ${analysis.currency}\`\n\n`;
  msg += `📈 *Niveles clave:*\n`;
  msg += `  🔴 Stop Loss: \`${fmt(analysis.stopLoss)}\`\n`;
  msg += `  🎯 TP1: \`${fmt(analysis.tp1)}\`\n`;
  msg += `  🎯 TP2: \`${fmt(analysis.tp2)}\`\n`;
  msg += `  🎯 TP3: \`${fmt(analysis.tp3)}\`\n\n`;
  msg += `📊 R/B: \`${analysis.riskReward.toFixed(2)}\`\n`;
  msg += `📉 Movimiento estimado: \`${analysis.movementPercent.toFixed(2)}%\`\n`;
  msg += `${riskIcon} Riesgo: ${analysis.riskLevel.toUpperCase()}\n`;
  msg += `🎯 Confianza: \`${analysis.confidenceScore}%\`\n\n`;
  if (analysis.capitalInvested > 0) {
    msg += `💵 Capital: \`${fmt(analysis.capitalInvested)} ${analysis.currency}\`\n`;
    msg += `✅ Ganancia estimada: \`+${fmt(analysis.gainEstimate)}\`\n`;
    msg += `❌ Pérdida estimada: \`-${fmt(analysis.lossEstimate)}\`\n\n`;
  }
  msg += `📝 _${analysis.analysisSummary.substring(0, 200)}_`;
  return msg;
}

export async function sendTelegramSignalAlert(analysis: AnalysisResult): Promise<{ success: boolean; error?: string }> {
  if (!BOT_TOKEN || !CHAT_ID) {
    return { success: false, error: "Telegram not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)" };
  }

  const message = formatSignalMessage(analysis);

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });

    if (!response.ok) {
      const errData = await response.json() as { description?: string };
      const errMsg = errData.description || "Unknown Telegram error";
      console.error("Telegram send error:", errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Network error";
    console.error("Telegram network error:", errMsg);
    return { success: false, error: errMsg };
  }
}

export function isTelegramConfigured(): boolean {
  return !!(BOT_TOKEN && CHAT_ID);
}
