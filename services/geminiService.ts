
import { GoogleGenAI } from "@google/genai";
import { InventoryModelType, InventoryParams, CalculationResult, AIConfig } from '../types';
import { MODEL_METADATA } from '../constants';

export async function getInventoryInsight(
  type: InventoryModelType, 
  params: InventoryParams, 
  results: CalculationResult,
  config: AIConfig
) {
  const modelName = MODEL_METADATA[type].name;
  const systemInstruction = "你是一名资深的供应链专家。侧重于跨领域的综合洞察、风险管理和实际运营建议。";
  const prompt = `
    模型：${modelName}
    指标：最佳订货量 Q*=${results.optimalQty.toFixed(1)}, 再订货点 ROP=${results.reorderPoint.toFixed(1)}, 年度总成本 TC=${results.totalCost.toFixed(0)}
    参数：年需求量 D=${params.demand}, 每次订货成本 S=${params.setupCost}, 单位持有成本 H=${params.holdingCost}, 采购单价 K=${params.unitPrice}, 生产速率 P=${params.productionRate || 'N/A'}
    
    作为专家，请分析该库存状态并给三条精炼的优化建议。请在回复中使用标准的存储论符号（Q, D, S, H, K, P, B）。使用中文回复。
  `;

  if (config.provider === 'deepseek') {
    if (!config.deepseekKey) throw new Error("DeepSeek API Key 未输入或未生效");
    
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          stream: false
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "DeepSeek API 调用失败");
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error("DeepSeek Service Error:", error);
      throw error;
    }
  }

  // Gemini (满足用户手动输入 Key 且接收后应用的需求)
  try {
    const apiKey = config.geminiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("Gemini API Key 未输入或未生效");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        systemInstruction,
        temperature: 0.7
      }
    });
    return response.text;
  } catch (error: any) {
    if (error.message?.includes("entity was not found")) {
      throw new Error("AUTH_REQUIRED");
    }
    console.error("Gemini AI Insight Error:", error);
    throw error;
  }
}
